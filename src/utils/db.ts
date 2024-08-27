import { JSONFilePreset } from "lowdb/node";

export default await JSONFilePreset<{ scanned: string[] }>("data/db.json", { scanned: [] });
