const express=require("express");
const router=express.Router();

const {validateTeam}=require("../fantasy-validation");

router.get("/health",(req,res)=>{
  res.json({
    ok:true,
    service:"batzo-fantasy",
    time:new Date().toISOString()
  });
});

router.post("/validate-team",(req,res)=>{
  try{
    const result=validateTeam(
      req.body.players,
      req.body.captainId,
      req.body.viceCaptainId
    );

    res.status(result.ok ? 200 : 400).json(result);
  }catch(error){
    res.status(500).json({
      ok:false,
      error:"Validation failed"
    });
  }
});

module.exports=router;
