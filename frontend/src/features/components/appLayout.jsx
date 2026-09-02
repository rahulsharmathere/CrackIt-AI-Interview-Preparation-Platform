import { Link, useNavigate, Outlet } from "react-router"
import { useAuth } from "../features/auth/hooks/useAuth"
import "./AppLayout.scss"

const AppLayout = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogoutClick = async () => {
        await handleLogout()
        navigate("/login")
    }

    return (
        <div className="app-layout">
            <header className="app-header">
                <Link to="/" className="app-header__logo">
                    CrackIt <span className="app-header__logo-accent">AI</span>
                </Link>

                <nav className="app-header__nav">
                    <Link to="/" className="app-header__link">Home</Link>
                    {user && (
                        <>
                            <span className="app-header__user">{user.username}</span>
                            <button className="app-header__logout" onClick={onLogoutClick}>
                                Logout
                            </button>
                        </>
                    )}
                </nav>
            </header>

            <main className="app-layout__content">
                <Outlet />
            </main>
        </div>
    )
}

export default AppLayout