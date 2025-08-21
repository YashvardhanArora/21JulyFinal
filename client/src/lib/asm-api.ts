// ASM-specific API client with token authentication
export async function asmApiRequest(
  method: string,
  url: string,
  data?: unknown,
  isFormData: boolean = false
): Promise<Response> {
  const token = localStorage.getItem('asmToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  };

  if (data && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? (isFormData ? data as BodyInit : JSON.stringify(data)) : undefined,
  });

  if (response.status === 401) {
    // Token is invalid, clear it and redirect to login
    localStorage.removeItem('asmToken');
    localStorage.removeItem('asmUser');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
}

export async function asmApiGet<T>(url: string): Promise<T> {
  const response = await asmApiRequest('GET', url);
  return response.json();
}

export async function asmApiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await asmApiRequest('POST', url, data);
  return response.json();
}

export async function asmApiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await asmApiRequest('PUT', url, data);
  return response.json();
}

export async function asmApiDelete<T>(url: string): Promise<T> {
  const response = await asmApiRequest('DELETE', url);
  return response.json();
}