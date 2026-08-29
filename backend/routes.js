const fs=require('fs');
const path=require('path');
const {validateTeam}=require('./fantasy-validation');

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
    try {
      const {
        match_id,
        team_name,
        players,
        captainId,
        viceCaptainId
      } = req.body || {};

      if (!match_id) {
        return res.status(400).json({
          success:false,
          message:'match_id is required'
        });
      }

      if (!Array.isArray(players)) {
        return res.status(400).json({
          success:false,
          message:'players array is required'
        });
      }

      const db=readDB();

      const match=db.matches.find(
        x=>x.id===Number(match_id)
      );

      if(!match){
        return res.status(404).json({
          success:false,
          message:'Match not found'
        });
      }

      const validation=validateTeam(
        players,
        captainId,
        viceCaptainId
      );

      if(!validation.ok){
        return res.status(400).json({
          success:false,
          message:validation.error,
          validation
        });
      }

      if(!Array.isArray(db.teams)){
        db.teams=[];
      }

      const userTeams=db.teams.filter(
        x=>String(x.user_id)===String(req.user.userId) &&
           Number(x.match_id)===Number(match_id)
      );

      if(userTeams.length>=10){
        return res.status(400).json({
          success:false,
          message:'Maximum 10 teams allowed for this match'
        });
      }

      const team={
        id:Date.now(),
        user_id:req.user.userId,
        match_id:Number(match_id),
        team_name:String(
          team_name || ('Team '+(userTeams.length+1))
        ).trim(),
        players:players.map(p=>({
          id:p.id,
          name:p.name,
          role:p.role,
          team:p.team,
          credits:Number(p.credits||0)
        })),
        captainId,
        viceCaptainId,
        credits:validation.credits,
        roles:validation.roles,
        teams:validation.teams,
        created_at:new Date().toISOString()
      };

      db.teams.push(team);
      writeDB(db);

      return res.status(201).json({
        success:true,
        message:'Team created successfully',
        team
      });

    } catch(error) {
      console.error('Create team failed:',error);

      return res.status(500).json({
        success:false,
        message:'Failed to create team'
      });
    }
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
