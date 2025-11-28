import { ApiService } from "@/core/components/services/api/api.service";
import { ConverData, payloadStartCoversion, PropsReq, ResultData } from "@/models/type";

export class FileOpenrationService {
  static readonly host = process.env.NEXT_PUBLIC_HOST;

  static upload = async (file: File): Promise<PropsReq> => {
    if (!file) throw new Error("Chưa chọn file");
    return await ApiService.upload(
      `${FileOpenrationService.host}upload-and-detect`,
      file
    );
  };

  static updateData = async (taskId: string, id: string, payload: any) => {
    return await ApiService.post(`${FileOpenrationService.host}tasks/${taskId}/row-by-id/${id}`, payload)
  }

  static startConversion = async (taskId: string, payload: payloadStartCoversion): Promise<ConverData> => {
    return await ApiService.post(`${FileOpenrationService.host}start-conversion/${taskId}`, payload)
  }

  static filterStatus = async (status: string, taskId: string): Promise<ConverData> => {
    return await ApiService.get(`${FileOpenrationService.host}tasks/${taskId}/filtered-data?filter_status=${status}`)
  }

  static preview = async (taskId:string, body: any) => {
      return await ApiService.post(`${FileOpenrationService.host}tasks/${taskId}/group-preview`, body)
  }

  static exportData = async (taskId: string, fileName: string) => {
    const blob = await ApiService.getFile<Blob>(
      `${FileOpenrationService.host}download-and-save/${taskId}`
    );

    // Tạo link download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Có thể lấy tên file từ header "Content-Disposition" nếu backend set
    a.download = fileName ? fileName : `result-${taskId}.xlsx`; // tuỳ bạn đặt
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}
