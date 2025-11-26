type NormalizeOpts = {
    preferDMY?: boolean; // ưu tiên DD/MM/YYYY khi mơ hồ
    acceptExcelSerial?: boolean; // chấp nhận số serial của Excel
    excel1904?: boolean; // nếu file dùng hệ 1904 (Mac cũ)
};

const _pad2 = (n: number | string) => String(n).padStart(2, "0");

const fmtDate = (d: Date, preferDMY = false) =>
    preferDMY
        ? `${_pad2(d.getDate())}/${_pad2(d.getMonth() + 1)}/${d.getFullYear()}`
        : `${_pad2(d.getMonth() + 1)}/${_pad2(d.getDate())}/${d.getFullYear()}`;

const EXCEL_BASE_1900 = Date.UTC(1899, 11, 30);
const EXCEL_BASE_1904 = Date.UTC(1904, 0, 1);

const looksLikeExcelSerial = (n: number) =>
    Number.isFinite(n) && n >= 60 && n <= 2958465; // 60 = 1900-02-29 (ngày "ảo" của Excel)

const excelSerialToDate = (n: number, use1904 = false) => {
    const base = use1904 ? EXCEL_BASE_1904 : EXCEL_BASE_1900;
    const ms = Math.round(n * 86400 * 1000); // hỗ trợ cả phần thập phân (giờ/phút)
    return new Date(base + ms);
};

export function normalizeDateInput(v: any, opts: NormalizeOpts = {}): string {
    const {
        preferDMY = false,
        acceptExcelSerial = false,
        excel1904 = false,
    } = opts;

    const toOut = (d: Date) => (isNaN(d.getTime()) ? "" : fmtDate(d, preferDMY));

    if (v == null || v === "") return "";

    // Date object
    if (v instanceof Date && !isNaN(v.getTime())) return toOut(v);

    // Number: ưu tiên Excel serial nếu bật cờ
    if (typeof v === "number") {
        if (acceptExcelSerial && looksLikeExcelSerial(v)) {
            return toOut(excelSerialToDate(v, excel1904));
        }
        // timestamp: ms nếu >= 1e12, s nếu >= 1e10, còn lại coi như giây
        const d =
            v >= 1e12 ? new Date(v) : v >= 1e10 ? new Date(v) : new Date(v * 1000);
        return toOut(d);
    }

    // String
    if (typeof v === "string") {
        const s = v.trim();
        if (!s) return "";

        // chỉ chữ số (có thể là Excel serial)
        if (acceptExcelSerial && /^\d+(\.\d+)?$/.test(s)) {
            const n = parseFloat(s);
            if (looksLikeExcelSerial(n))
                return toOut(excelSerialToDate(n, excel1904));
        }

        // ISO yyyy-mm-dd / yyyy/mm/dd
        let m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        const isValid = (y: number, m1: number, d: number) => {
            const dt = new Date(y, m1 - 1, d);
            return (
                dt.getFullYear() === y && dt.getMonth() === m1 - 1 && dt.getDate() === d
            );
        };
        if (m) {
            const y = +m[1],
                mo = +m[2],
                d = +m[3];
            return isValid(y, mo, d)
                ? fmtDate(new Date(y, mo - 1, d), preferDMY)
                : "";
        }

        // MM/DD/YYYY hoặc DD/MM/YYYY (xử lý mơ hồ)
        m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (m) {
            const a = +m[1],
                b = +m[2],
                y = m[3].length === 2 ? +("20" + m[3]) : +m[3];
            const asMDY = new Date(y, a - 1, b);
            const asDMY = new Date(y, b - 1, a);
            const mdyOk = isValid(y, a, b);
            const dmyOk = isValid(y, b, a);
            if (mdyOk && dmyOk) return fmtDate(preferDMY ? asDMY : asMDY, preferDMY);
            if (mdyOk) return fmtDate(asMDY, preferDMY);
            if (dmyOk) return fmtDate(asDMY, preferDMY);
            return "";
        }

        // Fallback: chỉ parse nếu có / hoặc -
        if (/[\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4}/.test(s)) {
            return toOut(new Date(s));
        }
        return "";
    }

    return "";
}

export function isValidUSDate(value: string) {
    // Bước 1: kiểm tra định dạng (MM/DD/YYYY)
    if (typeof value !== "string") return false;
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!regex.test(value)) return false;

    // Bước 2: kiểm tra logic ngày tháng
    const [month, day, year] = value.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}