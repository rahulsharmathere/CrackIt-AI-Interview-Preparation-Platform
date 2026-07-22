import {useState,useContext,useEffect} from "react"
import {AuthContext} from "../auth.context.jsx"
import {login,register,logout,getMe} from "../services/auth.api"

export const useAuth = ()=>{
    const {user,setUser,loading,setLoading} = useContext(AuthContext)
    
    const handleLogin = async({email,password})=>{
        setLoading(true)
        try{
            const data = await login({email,password})
            setUser(data.user)
        }catch(error){
            console.error("Error logging in:", error)
        } 
        finally {
            setLoading(false)
        }
    }

    const handleRegister = async({username,email,password})=>{
        setLoading(true)
        try{
            const data = await register({username,email,password})
            setUser(data.user)
        }catch(error){
            console.error("Error registering:", error)
        } 
        finally {
            setLoading(false)
        }
    }

    const handleLogout = async()=>{
        setLoading(true)
        try{
            await logout()
            setUser(null)
        }catch(error){
            console.error("Error logging out:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleGetMe = async()=>{
        setLoading(true)
        try{
            const data = await getMe()
            setUser(data.user)
        }catch(error){
            console.error("Error fetching user:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(()=>{
        const getAndSetUser = async()=>{
            try{
                const data = await getMe()
                setUser(data.user)
            } catch (error) {
                console.error("Error fetching user data:", error)
            } finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return {user,loading,handleLogin,handleRegister,handleLogout,handleGetMe}
}