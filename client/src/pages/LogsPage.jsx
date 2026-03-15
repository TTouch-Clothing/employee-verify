import { useEffect, useState } from "react";
import { http } from "../api/http";
import Card from "../components/Card";
import Badge from "../components/Badge";

function tone(r){ return r==="FOUND"?"green":r==="MISMATCH"?"yellow":"red"; }

export default function LogsPage(){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const { data } = await http.get("/api/admin/logs?limit=100");
      setItems(data.items || []);
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); },[]);

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{fontSize:22, fontWeight:950}}>Verification Logs</div>
        <button className="btn btn-ghost" onClick={load}>{loading ? "Loading..." : "Refresh"}</button>
      </div>

      <Card style={{padding:0, marginTop:14}}>
        <div style={{overflowX:"auto"}}>
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Employee ID</th>
                <th>Result</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it=>(
                <tr key={it._id}>
                  <td>{new Date(it.createdAt).toLocaleString()}</td>
                  <td style={{fontWeight:800}}>{it.employeeIdAttempted}</td>
                  <td><Badge tone={tone(it.result)}>{it.result}</Badge></td>
                  <td style={{color:"var(--muted)"}}>{it.ip || "-"}</td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan="4" style={{color:"var(--muted)"}}>No logs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
