export function playerPhoto(player){

  if(player && player.photo)
    return player.photo;

  const name =
    player?.short ||
    player?.name?.slice(0,2).toUpperCase() ||
    "PL";

  return "data:image/svg+xml," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg"
           width="160" height="160">
        <rect width="160" height="160" rx="30" fill="#101820"/>
        <text x="80" y="92"
              text-anchor="middle"
              fill="#22e879"
              font-size="48"
              font-family="Arial"
              font-weight="700">${name}</text>
      </svg>
    `);
}
