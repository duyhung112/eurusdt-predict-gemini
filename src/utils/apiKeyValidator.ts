

interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  message: string;
}

export const validateGeminiApiKey = async (apiKey: string): Promise<ApiKeyValidationResult> => {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      isValid: false,
      error: 'EMPTY_KEY',
      message: 'API key không được để trống'
    };
  }

  if (apiKey.length < 30) {
    return {
      isValid: false,
      error: 'INVALID_FORMAT',
      message: 'API key có định dạng không hợp lệ (quá ngắn)'
    };
  }

  try {
    const testResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Test connection' }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      })
    });

    if (testResponse.status === 403) {
      return {
        isValid: false,
        error: 'FORBIDDEN',
        message: 'API key không có quyền truy cập hoặc đã hết quota'
      };
    }

    if (testResponse.status === 401) {
      return {
        isValid: false,
        error: 'UNAUTHORIZED',
        message: 'API key không hợp lệ hoặc không được xác thực'
      };
    }

    if (testResponse.status === 400) {
      const errorData = await testResponse.json();
      if (errorData.error?.code === 'API_KEY_INVALID') {
        return {
          isValid: false,
          error: 'INVALID_KEY',
          message: 'API key không tồn tại hoặc không hợp lệ'
        };
      }
    }

    if (!testResponse.ok) {
      return {
        isValid: false,
        error: 'API_ERROR',
        message: `Lỗi API: ${testResponse.status} - ${testResponse.statusText}`
      };
    }

    // If we get here, the API key is valid
    return {
      isValid: true,
      message: 'API key hợp lệ và hoạt động tốt'
    };

  } catch (error) {
    console.error('API key validation error:', error);
    return {
      isValid: false,
      error: 'NETWORK_ERROR',
      message: 'Không thể kết nối để kiểm tra API key. Kiểm tra kết nối mạng.'
    };
  }
};

export const isValidApiKeyFormat = (apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) return false;
  if (apiKey.length < 30) return false;
  
  // Basic format check for Google API keys
  const googleApiKeyPattern = /^AIza[0-9A-Za-z-_]{35}$/;
  return googleApiKeyPattern.test(apiKey.trim());
};

