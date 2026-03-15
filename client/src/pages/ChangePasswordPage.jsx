import { useState } from "react";
import { http } from "../api/http";
import Card from "../components/Card";
import Input from "../components/Input";
import toast from "react-hot-toast";

function PasswordField({ label, value, onChange }) {

  const [show,setShow] = useState(false);

  return (
    <div style={{marginBottom:12}}>

      <div className="label">{label}</div>

      <div style={{position:"relative"}}>

        <input
          className="input"
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          style={{paddingRight:45}}
        />

        <i
          className={`fa ${show ? "fa-eye-slash" : "fa-eye"}`}
          onClick={()=>setShow(!show)}
          style={{
            position:"absolute",
            right:14,
            top:"50%",
            transform:"translateY(-50%)",
            cursor:"pointer",
            color:"#6B7280",
            fontSize:16
          }}
        />

      </div>

    </div>
  );
}

export default function ChangePasswordPage(){

  const [currentPassword,setCurrentPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");
  const [saving,setSaving] = useState(false);

  async function onSubmit(e){

    e.preventDefault();
    setSaving(true);

    try{

      const { data } = await http.patch("/api/admin/change-password",{
        currentPassword,
        newPassword,
        confirmPassword
      });

      toast.success(data.message || "Password changed successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    }catch(error){

      if(Array.isArray(error?.response?.data?.details)){

        toast.error(error.response.data.details.join(", "));

      }else{

        toast.error(
          error?.response?.data?.message ||
          "Failed to change password"
        );
      }

    }finally{

      setSaving(false);

    }
  }

  return (

    <div
      style={{
        display:"flex",
        justifyContent:"center",
        paddingTop:20
      }}
    >

      <div style={{width:"100%",maxWidth:600}}>

        <div style={{fontSize:22,fontWeight:950,marginBottom:14}}>
          Change Password
        </div>

        <Card style={{padding:20}}>

          <form onSubmit={onSubmit}>

            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={e=>setCurrentPassword(e.target.value)}
            />

            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={e=>setNewPassword(e.target.value)}
            />

            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={e=>setConfirmPassword(e.target.value)}
            />

            <button
              className="btn btn-primary"
              style={{width:"100%"}}
              disabled={saving}
            >
              {saving ? "Changing..." : "Change Password"}
            </button>

          </form>

        </Card>

      </div>

    </div>
  );
}