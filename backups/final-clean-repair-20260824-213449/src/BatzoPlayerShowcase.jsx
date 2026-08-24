import React from "react";
import "./batzo-player-showcase.css";

const players = [
  ["Virat Kohli","IND","BAT","9.5","82","🔥"],
  ["Rohit Sharma","IND","BAT","9.0","76","🔥"],
  ["Jasprit Bumrah","IND","BOWL","9.5","91","🔥"],
  ["Ravindra Jadeja","IND","AR","9.0","84","🔥"],
  ["Rishabh Pant","IND","WK","9.0","73","⚡"],
  ["Shubman Gill","IND","BAT","9.0","79","🔥"],
  ["Hardik Pandya","IND","AR","8.5","71","⚡"],
  ["Kuldeep Yadav","IND","BOWL","8.5","68","🔥"],
  ["Suryakumar Yadav","IND","BAT","9.0","88","🔥"],
  ["Mohammed Siraj","IND","BOWL","8.5","64","⚡"],
  ["KL Rahul","IND","WK","8.5","70","🔥"],
  ["Axar Patel","IND","AR","8.5","75","🔥"],

  ["Joe Root","ENG","BAT","9.0","81","🔥"],
  ["Ben Stokes","ENG","AR","9.0","78","⚡"],
  ["Jos Buttler","ENG","WK","9.0","85","🔥"],
  ["Jofra Archer","ENG","BOWL","8.5","69","⚡"],
  ["Babar Azam","PAK","BAT","9.0","80","🔥"],
  ["Shaheen Afridi","PAK","BOWL","9.0","86","🔥"],
  ["Mohammad Rizwan","PAK","WK","8.5","74","🔥"],
  ["Shadab Khan","PAK","AR","8.0","67","⚡"],
  ["Kane Williamson","NZ","BAT","8.5","77","🔥"],
  ["Trent Boult","NZ","BOWL","8.5","83","🔥"],
  ["Glenn Maxwell","AUS","AR","9.0","72","⚡"],
  ["Pat Cummins","AUS","BOWL","9.0","80","🔥"],
  ["Mitchell Starc","AUS","BOWL","8.5","79","🔥"],
  ["Steve Smith","AUS","BAT","8.5","76","🔥"],
  ["David Warner","AUS","BAT","8.5","73","⚡"],
  ["Heinrich Klaasen","SA","WK","9.0","89","🔥"],
  ["Kagiso Rabada","SA","BOWL","8.5","78","🔥"],
  ["Quinton de Kock","SA","WK","8.5","71","⚡"],
  ["Aiden Markram","SA","AR","8.0","69","🔥"],
  ["Nicholas Pooran","WI","WK","8.5","83","🔥"],
  ["Andre Russell","WI","AR","9.0","77","⚡"],
  ["Jason Holder","WI","AR","8.0","65","🔥"],
  ["Rashid Khan","AFG","BOWL","9.0","90","🔥"],
  ["Rahmanullah Gurbaz","AFG","WK","8.0","68","⚡"],
  ["Wanindu Hasaranga","SL","AR","8.5","81","🔥"],
  ["Pathum Nissanka","SL","BAT","8.0","66","🔥"],
  ["Litton Das","BAN","WK","8.0","64","⚡"],
  ["Mustafizur Rahman","BAN","BOWL","8.0","70","🔥"],
  ["Sikandar Raza","ZIM","AR","8.0","72","🔥"],
  ["Mark Wood","ENG","BOWL","8.0","63","⚡"],
  ["Harry Brook","ENG","BAT","8.5","75","🔥"],
  ["Daryl Mitchell","NZ","AR","8.5","74","🔥"],
  ["Rachin Ravindra","NZ","AR","8.5","79","🔥"],
  ["Fakhar Zaman","PAK","BAT","8.0","67","⚡"],
  ["Haris Rauf","PAK","BOWL","8.0","71","🔥"],
  ["Marco Jansen","SA","AR","8.0","73","🔥"],
  ["Reeza Hendricks","SA","BAT","7.5","62","⚡"]
];

const roleIcon = {
  BAT: "🏏",
  WK: "🧤",
  AR: "🔄",
  BOWL: "⚡"
};

export default function BatzoPlayerShowcase() {
  return (
    <section className="bz-player-section">
      <div className="bz-player-section-head">
        <div>
          <div className="bz-player-kicker">BATZO CRICKET HUB</div>
          <h2>Featured Players</h2>
          <p>International stars in action</p>
        </div>
        <span className="bz-player-count">48 PLAYERS</span>
      </div>

      <div className="bz-player-carousel">
        {players.map(([name, team, role, credit, points, form], i) => (
          <article className="bz-player-card-real" key={name}>
            <div className={"bz-player-action bz-action-" + (i % 6)}>
              <span className="bz-stadium-glow"></span>
              <span className="bz-player-silhouette">
                {roleIcon[role]}
              </span>
              <span className="bz-player-number">
                {String((i % 99) + 1).padStart(2,"0")}
              </span>
              <span className="bz-team-pill">{team}</span>
            </div>

            <div className="bz-player-info">
              <div className="bz-player-name-row">
                <div>
                  <strong>{name}</strong>
                  <small>{role} • {team}</small>
                </div>
                <span className="bz-form">{form}</span>
              </div>

              <div className="bz-player-stats">
                <div>
                  <small>FORM</small>
                  <b>{form}</b>
                </div>
                <div>
                  <small>CREDIT</small>
                  <b>{credit}</b>
                </div>
                <div>
                  <small>POINTS</small>
                  <b>{points}</b>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
