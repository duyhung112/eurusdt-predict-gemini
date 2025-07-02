
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

  // Check basic format for Google API keys
  if (!isValidApiKeyFormat(apiKey)) {
    return {
      isValid: false,
      error: 'INVALID_FORMAT',
      message: 'API key có định dạng không hợp lệ (phải bắt đầu với AIza và có 39 ký tự)'
    };
  }

  try {
    // Test with a simple request to Gemini API - using the newer API endpoint
    const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hi' }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      })
    });

    console.log('API Test Response Status:', testResponse.status);

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
      try {
        const errorData = await testResponse.json();
        console.log('API Error Details:', errorData);
        
        // Check for various error patterns
        const errorMessage = errorData.error?.message || '';
        if (errorMessage.includes('API_KEY_INVALID') || 
            errorMessage.includes('Invalid API key') ||
            errorMessage.includes('API key not valid')) {
          return {
            isValid: false,
            error: 'INVALID_KEY',
            message: 'API key không tồn tại hoặc không hợp lệ'
          };
        }
        
        // If it's just a model error but key is valid, that's okay
        if (errorMessage.includes('models/gemini-pro')) {
          // Try with different model
          return await validateWithDifferentModel(apiKey);
        }
        
      } catch (e) {
        console.log('Could not parse error response');
      }
    }

    if (testResponse.status === 404) {
      // Try with gemini-pro instead
      return await validateWithDifferentModel(apiKey);
    }

    // Check if response is successful (200-299)
    if (testResponse.ok) {
      try {
        const responseData = await testResponse.json();
        if (responseData.candidates || responseData.error) {
          return {
            isValid: true,
            message: 'API key hợp lệ và hoạt động tốt!'
          };
        }
      } catch (e) {
        console.log('Response parsing error, but API key seems valid');
      }
      
      return {
        isValid: true,
        message: 'API key hợp lệ và hoạt động tốt!'
      };
    }

    // If we get here, try with a different approach
    return await validateWithDifferentModel(apiKey);

  } catch (error) {
    console.error('API key validation error:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        isValid: false,
        error: 'NETWORK_ERROR',
        message: 'Không thể kết nối để kiểm tra API key. Kiểm tra kết nối mạng.'
      };
    }
    
    return {
      isValid: false,
      error: 'UNKNOWN_ERROR',
      message: 'Lỗi không xác định khi kiểm tra API key'
    };
  }
};

// Helper function to try validation with different model
const validateWithDifferentModel = async (apiKey: string): Promise<ApiKeyValidationResult> => {
  try {
    const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Test' }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 5
        }
      })
    });

    console.log('Fallback API Test Response Status:', testResponse.status);

    if (testResponse.status === 401 || testResponse.status === 403) {
      return {
        isValid: false,
        error: 'INVALID_KEY',
        message: 'API key không hợp lệ hoặc không có quyền truy cập'
      };
    }

    if (testResponse.ok || testResponse.status === 400) {
      // Even 400 might indicate the key is valid but request format issues
      return {
        isValid: true,
        message: 'API key hợp lệ!'
      };
    }

    return {
      isValid: false,
      error: 'API_ERROR',
      message: `Không thể xác thực API key. Status: ${testResponse.status}`
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'VALIDATION_ERROR',
      message: 'Không thể kiểm tra API key'
    };
  }
};

export const isValidApiKeyFormat = (apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) return false;
  
  // Google API keys start with "AIza" and are exactly 39 characters long
  const trimmedKey = apiKey.trim();
  
  // Check length and prefix
  if (trimmedKey.length !== 39) return false;
  if (!trimmedKey.startsWith('AIza')) return false;
  
  // Check if contains only valid characters (alphanumeric, dash, underscore)
  const validChars = /^[A-Za-z0-9\-_]+$/;
  return validChars.test(trimmedKey);
};
