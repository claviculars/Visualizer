import fs from 'fs';
import { parseLogFile } from './src/utils/parser.js';

const logText = fs.readFileSync('../115921.log', 'utf-8');
parseLogFile(logText).then(res => {
   const timeline = res.data['INTARIAN_PEPPER_ROOT'].timeline;
   const interesting = timeline.filter(r => r.timestamp >= 1200 && r.timestamp <= 1500);
   interesting.forEach(r => console.log(`ts: ${r.timestamp}, pos: ${r.position}`));
});
