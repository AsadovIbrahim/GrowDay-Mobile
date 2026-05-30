import { API_URL } from '@env';
import { storage, clearUserSession } from './MMKVStore';

const VITE_API_URL = API_URL;

const getHeaders = (token = null, contentType = "application/json") => {
    const headers = {
        "Accept-Language": storage.getString('userLanguage') || 'en',
    };
    if (contentType) {
        headers["Content-Type"] = contentType;
    }
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};

// Override global fetch locally to handle 401s and Refresh Tokens transparently
const originalFetch = global.fetch || fetch;

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const customFetch = async (url, options = {}) => {
    let response = await originalFetch(url, options);

    // If unauthorized, and it's not a login or refresh request
    if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/refresh-token')) {
        
        if (isRefreshing) {
            // Queue this request and wait for the refresh token to arrive
            return new Promise(function(resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                const newHeaders = { ...options.headers };
                newHeaders["Authorization"] = `Bearer ${token}`;
                return originalFetch(url, { ...options, headers: newHeaders });
            }).catch(err => {
                return response; // Return original 401 if refresh failed
            });
        }

        isRefreshing = true;

        try {
            // Attempt to refresh token
            const refreshRes = await originalFetch(`${VITE_API_URL}/api/auth/refresh-token`, {
                method: "POST",
                headers: {
                    "Accept-Language": storage.getString('userLanguage') || 'en',
                    "Content-Type": "application/json"
                },
                credentials: 'include'
            });

            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                // Depending on your API's standard response structure: Result<T> or raw object
                const newToken = refreshData?.data?.token || refreshData?.token;

                if (newToken) {
                    // Save new token
                    storage.set('accessToken', newToken);

                    // Update headers and retry original request
                    const newHeaders = { ...options.headers };
                    newHeaders["Authorization"] = `Bearer ${newToken}`;
                    const newOptions = { ...options, headers: newHeaders };

                    response = await originalFetch(url, newOptions);
                    
                    // Resolve queued requests with the new token
                    processQueue(null, newToken);
                } else {
                    processQueue(new Error("No token returned"));
                }
            } else {
                processQueue(new Error("Refresh failed"));
            }
        } catch (error) {
            console.log('Refresh token error:', error);
            processQueue(error);
        } finally {
            isRefreshing = false;
        }
    }

    return response;
};

// Shadow fetch for all functions below this point in this file
const fetch = customFetch;

const handleResponse = async (response) => {
    if (response.status === 401) {
        clearUserSession();
        // Optional: you could also reload the app or navigate to login here
        // but since App.tsx reacts to accessToken change, it should work automatically.
        return { success: false, message: "Session expired. Please login again.", isUnauthorized: true };
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data;
    }
    return { success: response.ok, status: response.status };
};

export const loginfetch = async (formData) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData),
    });
    const data=await response.json();
    return data;
}

export const googleLoginFetch = async (idToken) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ idToken }),
    });
    const text = await response.text();
    console.log("RAW GOOGLE LOGIN RESPONSE:", text);
    try {
        const data = JSON.parse(text);
        return data;
    } catch (e) {
        throw new Error(`JSON Parse Error. Raw response was: ${text.substring(0, 50)}...`);
    }
}

export const registerfetch = async (formData) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData),
    });
    const data=await response.json();
    return data;
}

export const forgotPasswordfetch = async (formData) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });
    const data=await response.json();
    return data;
}

export const createUserPreferencesFetch = async (token,payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserPreferences/CreateUserPreferences`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    const data=await response.json();
    return data;
}

export const updateUserPreferencesFetch = async (token,payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserPreferences/UpdateUserPreferences`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    const data=await response.json();
    return data;
}


export const updateUserPreferencesWithAIFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserPreferences/UpdateUserPreferencesWithAI`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};


export const createUserPreferencesWithAIFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserPreferences/CreateUserPreferencesWithAI`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
};

export const getAllHabitsFetch = async (token,pageIndex=0,pageSize=3) => {
    const response = await fetch(`${VITE_API_URL}/api/Habit/GetAllHabits?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });

    const data=await response.json();
    return data;

}

export const getUserHabitFetch = async (token,pageIndex=0,pageSize=3) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/GetMyHabits?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getTodaysUserHabitFetch = async (token, date = null,pageIndex=0,pageSize=10) => {
    let url = `${VITE_API_URL}/api/UserHabit/GetTodayHabits?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`;
    if (date) {
        const dateStr = date instanceof Date 
            ? date.toISOString().split('T')[0]
            : date;
        url += `&date=${dateStr}`;
    }
    const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getUnreadNotificationCountFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/unreadcount?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getUserHabitCountFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/getuserhabitcount?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}
export const getUserHabitByFrequencyFetch = async (token, frequency) => {
    const baseUrl = `${VITE_API_URL}/api/UserHabit/GetUserHabitByFrequency`;
    const url = frequency && frequency !== "All"
        ? `${baseUrl}?frequency=${frequency}&_t=${Date.now()}`
        : `${baseUrl}?_t=${Date.now()}`;
  
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    });
  
    return await response.json();
  };
  

export const getUserNotificationsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/getnotification?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getUserUnreadNotificationsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/unreadnotifications?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const deleteNotificationFetch = async (token,notificationId) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/${notificationId}`, {
        method: "DELETE",
        headers: getHeaders(token),
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const markAsAllReadNotificationFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/readall`, {
        method: "PUT",
        headers: getHeaders(token),
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const getUserPreferencesFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserPreferences/GetUserPreferences?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getNotificationDetailFetch = async (token,notificationId) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/${notificationId}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return null;
};

export const readNotificationFetch = async (token,notificationId) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/read/${notificationId}`, {
        method: "PUT",
        headers: getHeaders(token),
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const getDailyStatisticsFetch = async (token, date = null) => {
    const url = date 
        ? `${VITE_API_URL}/api/Statistic/daily?date=${date}&_t=${Date.now()}`
        : `${VITE_API_URL}/api/Statistic/daily?_t=${Date.now()}`;
    const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getWeeklyStatisticsFetch = async (token, weekStart = null) => {
    let url = `${VITE_API_URL}/api/Statistic/weekly?_t=${Date.now()}`;
    if (weekStart) {
        url += `&weekStart=${weekStart}`;
    }
    const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getMonthlyStatisticsFetch = async (token, year, month) => {
    const response = await fetch(`${VITE_API_URL}/api/Statistic/monthly?year=${year}&month=${month}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getYearlyStatisticsFetch = async (token, year) => {
    const response = await fetch(`${VITE_API_URL}/api/Statistic/yearly?year=${year}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getUserSuggestedHabitsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/SuggestedHabit/GetUserSuggestedHabits?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const regenerateSuggestedHabitsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/SuggestedHabit/RegenerateForUser`, {
        method: "POST",
        headers: getHeaders(token),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const addUserHabitFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/CreateSharedHabit`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    const textMessage = await response.text();
    return { success: response.ok, status: response.status, message: textMessage };
};

export const addCustomUserHabitFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/CreateMyOwnHabit`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    const textMessage = await response.text();
    return { success: response.ok, status: response.status, message: textMessage };
};
export const deleteUserHabitFetch = async (token,userHabitId) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/${userHabitId}`, {
        method: "DELETE",
        headers: getHeaders(token),
    });
    
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { ...data, status: response.status, ok: response.ok };
    }
    
    return { status: response.status, ok: response.ok, success: response.ok };
};

// ─── ACHIEVEMENT ────────────────────────────────────────────────────────────
export const getUserAchievementsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getNewAchievementsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/new?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getAchievementStatsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/stats?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const markAchievementsAsSeenFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/mark-seen`, {
        method: "PATCH",
        headers: getHeaders(token),
    });
    const data = await response.json();
    return data;
};

export const getUserTotalXPFetch=async(token)=>{
    const response=await fetch(`${VITE_API_URL}/api/User/GetUserTotalXPCount`,{
        method:"GET",
        headers:getHeaders(token),
        cache: "no-store",
    });
    const res = await handleResponse(response);
    if (res && res.success && typeof res.data === 'number') {
        const currentPoints = res.data;
        const currentLevel = Math.floor(Math.sqrt(currentPoints / 50)) + 1;
        const lastKnownLevel = storage.getNumber('user.lastKnownLevel') || 0;
        
        if (lastKnownLevel > 0 && currentLevel > lastKnownLevel) {
            // Level up detected!
            storage.set('user.pendingLevelUp', currentLevel);
        }
        storage.set('user.lastKnownLevel', currentLevel);
        storage.set('user.totalPoints', currentPoints);
    }
    return res;
}

export const getUserHabitByIdFetch = async (token, userHabitId, date = null) => {
    const url = date 
        ? `${VITE_API_URL}/api/UserHabit/${userHabitId}?date=${date}&_t=${Date.now()}`
        : `${VITE_API_URL}/api/UserHabit/${userHabitId}?_t=${Date.now()}`;
    const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const completeUserHabitFetch = async (token, userHabitId, payload = {}) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/Complete/${userHabitId}`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    
    let result = { success: response.ok, status: response.status };
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        result = await response.json();
    }
    
    if (result.success || result.ok) {
        getUserTotalXPFetch(token).catch(e => console.log('Background XP fetch error:', e));
    }
    return result;
};

export const incrementUserHabitFetch = async (token, userHabitId, payload = {}) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/Increment/${userHabitId}`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const reportHabitProgressFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/report-progress`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const getWeeklyProgressFetch = async (token, userHabitId) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/GetWeeklyProgress/${userHabitId}?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getMonthlyProgressFetch = async (token, userHabitId, year, month) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/GetMonthlyProgress/${userHabitId}?year=${year}&month=${month}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};


export const verifyOtpFetch=async (email,otpCode)=>{
    const response=await fetch(`${VITE_API_URL}/api/auth/verify-otp`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
        },
        body:JSON.stringify({email,otpCode}),
    });
    return handleResponse(response);
};
  
export const verifyForgotPasswordOtpFetch = async (email, otpCode) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/verify-forgot-password-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otpCode }),
    });
    return handleResponse(response);
};

export const resetPasswordFetch = async (token, password, confirmPassword) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password, confirmPassword }),
    });
    return handleResponse(response);
};

export const getUserTasksFetch = async (token, pageIndex = 0, pageSize = 10) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    return handleResponse(response);
};

export const getUserTaskByIdFetch = async (token, id) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/${id}?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    return handleResponse(response);
};

export const getUserTaskStatsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/stats?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    return handleResponse(response);
};

export const getUserTasksByStatusFetch = async (token, status) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/status/${status}?_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    return handleResponse(response);
};

export const completeUserTaskFetch = async (token, id) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/${id}/complete`, {
        method: "PATCH",
        headers: getHeaders(token),
    });
    const res = await handleResponse(response);
    if (res && res.success) {
        getUserTotalXPFetch(token).catch(e => console.log('Background XP fetch error:', e));
    }
    return res;
};

export const updateUserTaskFetch = async (token, id, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/${id}`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const deleteUserTaskFetch = async (token, id) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const getAccountDataFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Account/GetAccountData`, {
        method: "GET",
        headers: getHeaders(token),
    });
    return handleResponse(response);
};

export const updateAccountFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/Account/UpdateAccount`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const updateFcmTokenFetch = async (token, fcmToken) => {
    const response = await fetch(`${VITE_API_URL}/api/Account/UpdateFcmToken`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify({ fcmToken }),
    });
    const data = await response.json();
    return data;
};

export const changePasswordFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/Account/ChangePassword`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};


export const addSuggestedHabitFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/AddSuggestedHabitToUser`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    const textMessage = await response.text();
    return { success: response.ok, status: response.status, message: textMessage };
};

export const getUserLearningContentFetch = async (token, pageIndex = 0, pageSize = 10) => {
    const response = await fetch(`${VITE_API_URL}/api/Learning/GetSuggestedContent?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const markLearningContentAsReadFetch = async (token, contentId) => {
    const response = await fetch(`${VITE_API_URL}/api/Learning/MarkAsRead/${contentId}`, {
        method: "PATCH",
        headers: getHeaders(token),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const updateUserHabitFetch = async (token, userHabitId, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/${userHabitId}`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    const textMessage = await response.text();
    return { success: response.ok, status: response.status, message: textMessage };
};

export const removeUserHabitFetch = async (token, userHabitId) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/${userHabitId}`, {
        method: "DELETE",
        headers: getHeaders(token),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const sendSupportMessageFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/Support/SendMessage`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const deleteAccountFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Account/DeleteAccount`, {
        method: "DELETE",
        headers: getHeaders(token),
    });
    return handleResponse(response);
};

export const submitGameScoreFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/Game/submit-score`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });
    const res = await handleResponse(response);
    if (res && res.success) {
        getUserTotalXPFetch(token).catch(e => console.log('Background XP fetch error:', e));
    }
    return res;
};

export const getGameLeaderboardFetch = async (token, gameType, limit = 20) => {
    const response = await fetch(`${VITE_API_URL}/api/Game/leaderboard?gameType=${gameType}&limit=${limit}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    return handleResponse(response);
};

export const getGamePersonalBestFetch = async (token, gameType) => {
    const response = await fetch(`${VITE_API_URL}/api/Game/personal-best?gameType=${gameType}&_t=${Date.now()}`, {
        method: "GET",
        headers: getHeaders(token),
        cache: "no-store",
    });
    return handleResponse(response);
};

export const getUserGameScoreHistoryFetch = async (token, gameType) => {
    const response = await fetch(`${VITE_API_URL}/api/Game/score-history?gameType=${gameType}`, {
        method: "GET",
        headers: getHeaders(token),
    });
    return handleResponse(response);
};

export const buyStreakFreezeFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Store/BuyItem/streak_freeze`, {
        method: "POST",
        headers: getHeaders(token),
    });
    return handleResponse(response);
};

export const buyStoreItemFetch = async (token, itemType) => {
    const response = await fetch(`${VITE_API_URL}/api/Store/BuyItem/${itemType}`, {
        method: "POST",
        headers: getHeaders(token),
    });
    return handleResponse(response);
};

export const aiMentorChatFetch = async (token, message, history) => {
    const response = await fetch(`${VITE_API_URL}/api/AIMentor/Chat`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify({ message, history }),
    });
    return handleResponse(response);
};

export const aiMentorRemainingFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/AIMentor/RemainingMessages`, {
        method: "GET",
        headers: getHeaders(token),
    });
    return handleResponse(response);
};