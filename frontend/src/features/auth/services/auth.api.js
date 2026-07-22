import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:3000/api",
    withCredentials: true
});

export const register = async ({username, email, password}) => {
    try {
        const response = await api.post("/auth/register", {
            username,
            email,
            password
        });
        return response.data;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

export const login = async ({email, password}) => {
    try {
        const response = await api.post("/auth/login", {
            email,
            password
        });
        return response.data;
    } catch (error) {
        console.error("Error logging in user:", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await api.post("/auth/logout")
        return response.data;
    } catch (error) {
        console.error("Error logging out user:", error);
        throw error;
    }
};

export const getMe = async () => {
    try {
        const response = await api.get("/auth/get-me")
        return response.data;
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
};
