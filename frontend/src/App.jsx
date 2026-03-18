// src/App.jsx  ─  Auth router (replaces old standalone dashboard)
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",minHeight:"100vh",gap:16,
        background:"#080810",color:"rgba(255,255,255,.7)",
        fontFamily:"'DM Sans',sans-serif",fontSize:14,
      }}>
        <div style={{
          width:36,height:36,
          border:"3px solid rgba(108,71,255,.25)",
          borderTopColor:"#6c47ff",borderRadius:"50%",
          animation:"spin .7s linear infinite",
        }}/>
        Loading NewsPulse…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}