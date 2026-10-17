import {readFile} from 'node:fs/promises';
// Available only inside automated browser checks; never published with game assets.
export async function installMeetingDemo(page){
 const [html,script]=await Promise.all(['night-shift-meeting-demo.html','night-shift-meeting-demo.js'].map(name=>readFile(new URL('./fixtures/'+name,import.meta.url),'utf8')));
 await page.route(/\/night-shift-meeting-demo(?:\?.*)?$/,route=>route.fulfill({contentType:'text/html',body:html}));
 await page.route(/\/night-shift\/meeting-demo\.js(?:\?.*)?$/,route=>route.fulfill({contentType:'text/javascript',body:script}));
}
