import axios from 'axios';
import hash from 'object-hash';
import { Subject, firstValueFrom } from 'rxjs';
import { NotifyService } from '../notify.service';


// Api Service chỉ quản lý token
const CACHE_DURATION = 2000; // 2s
const CACHE: Record<
    string,
    {
        createdDate: Date;
        subject: Subject<any>;
        response?: any;
    }
> = {};

const handleResponse = (response: any) => {
    if ('statusCode' in response) {
        if (response?.statusCode === 401) {
            NotifyService.error(response?.message || 'Có lỗi xảy ra');
            throw new Error(response?.message || 'Có lỗi xảy ra');
        } else if (response?.statusCode && !response?.success) {
            NotifyService.error(response?.message || 'Có lỗi xảy ra');
            throw new Error(response?.message || 'Có lỗi xảy ra');
        }
    }
};

const get = async <T = any>(path: string, params?: any): Promise<T> => {
    const url = new URL(path);
    params && Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: headers,
    });
    const res = await response.json();
    handleResponse(res);
    return res?.data;
};

const getFile = async <T = any>(path: string, params?: any): Promise<T> => {
  const url = new URL(path);
  params &&
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key]),
    );

  const response = await fetch(url.toString(), {
    method: "GET",
  });

  const contentType = response.headers.get("content-type") ?? "";

  // Nếu server trả JSON (ví dụ lỗi)
  if (contentType.includes("application/json")) {
    const res = await response.json();
    handleResponse(res);
    return res?.data as T;
  }

  // Ngược lại coi như file blob
  const blob = await response.blob();
  return blob as T;
};


const post = async <T = any>(path: string, body?: any, params?: any): Promise<T> => {
    const url = new URL(path);
    params && Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    // XỬ LÝ CACHING TRÁNH GỌI VỀ SERVER NHIỀU LẦN CÙNG 1 REQUEST
    const response = await fetch(url.toString(), {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const res = await response.json();
    handleResponse(res);
    return res?.data;
};

const upload = async <T = any>(path: string, file: File, params?: any): Promise<T> => {
    const url = new URL(path);
    params && Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    let formData = new FormData();
    formData.append('file', file);
    const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData,
    });

    const res = await response.json();
    handleResponse(res);
    return res?.data;
};

const download = async (path: string, name?: string) => {
    const url = new URL(path);
    return await axios({
        url: `${url}`, //your url
        method: 'GET',
        responseType: 'blob',
    })
        .then(response => {
            let filename = '';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            filename = filename || name || '';
            const file = new Blob([response.data], { type: response.data?.type });
            const url = window.URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            if (filename) {
                link.setAttribute('download', filename);
            }
            document.body.appendChild(link);
            link.click();
        })
        .catch(error => {
            console.error(error);
            NotifyService.warn('Có lỗi xảy ra khi tải tập tin');
        });
};

const readFile = async (file: File, name?: string) => {
    let fileName = name || `Export-${new Date()}.xlsx`;
    let type = 'application/octet-stream';
    const fileDownload = new Blob([file], { type });
    const url = window.URL.createObjectURL(fileDownload);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
};

const put = async <T = any>(path: string, body?: any, params?: any): Promise<T> => {
    const url = new URL(path);
    params && Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const response = await fetch(url.toString(), {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const res = await response.json();
    handleResponse(res);
    return res?.data;
};

const del = async <T = any>(path: string, params?: any): Promise<T> => {
    const url = new URL(path);
    params && Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const res = await response.json();
    handleResponse(res);
    return res?.data;
};

export const ApiService = {
    get,
    getFile,
    post,
    put,
    upload,
    delete: del,
    download,
    readFile,
};
