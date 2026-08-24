const fs=require('fs');
const path=require('path');

const dbFile=path.join(__dirname,'data','batzo.json');

function readDB(){
  return JSON.parse(fs.readFileSync(dbFile,'utf8'));
}

function writeDB(db){
  fs.writeFileSync(dbFile,JSON.stringify(db,null,2));
}

function registerRoutes(app, authenticateToken){

  app.get('/api/matches',(req,res)=>{
    const db=readDB();
    res.json({success:true,matches:db.matches});
  });

  app.get('/api/matches/:id',(req,res)=>{
    const db=readDB();
    const match=db.matches.find(x=>x.id===Number(req.params.id));

    if(!match){
      return res.status(404).json({
        success:false,
        message:'Match not found'
      });
    }

    const contests=db.contests.filter(x=>x.match_id===match.id);

    res.json({
      success:true,
      match,
      contests
    });
  });

  app.get('/api/contests',(req,res)=>{
    const db=readDB();
    res.json({success:true,contests:db.contests});
  });

  app.post('/api/teams',authenticateToken,(req,res)=>{
    const {match_id,team_name}=req.body;

    if(!match_id || !team_name){
      return res.status(400).json({
        success:false,
        message:'match_id and team_name are required'
      });
    }

    const db=readDB();

    const match=db.matches.find(x=>x.id===Number(match_id));

    if(!match){
      return res.status(404).json({
        success:false,
        message:'Match not found'
      });
    }

    const team={
      id:db.teams.length+1,
      user_id:req.user.userId,
      match_id:Number(match_id),
      team_name:String(team_name).trim(),
      created_at:new Date().toISOString()
    };

    db.teams.push(team);
    writeDB(db);

    res.status(201).json({
      success:true,
      message:'Team created',
      team
    });
  });

  app.get('/api/my-teams',authenticateToken,(req,res)=>{
    const db=readDB();
    const teams=db.teams.filter(x=>x.user_id===req.user.userId);

    res.json({
      success:true,
      teams
    });
  });
}

module.exports={registerRoutes};
