// Debug position 121
const input = `[{\\"tag\\":\\"137\\",\\"msg_id\\":\\"88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168\\",\\"data\\":\\"{\\\\\\\"audit_status\\\\\\\":3,\\\\\\\"audit_status_desc\\\\\\":\\\\\\"\\\\\\",\\\\\\\"byte_url\\\\\\":\\\\\\"\\\\\\",\\\\\\\"create_time\\\\\\":\\\\\\"2026-02-02 16:41:07\\\\\\",\\\\\\\"delete_time\\\\\\":\\\\\\"\\\\\\",\\\\\\\"folder_id\\\\\\":\\\\\\"75765752952458775141600\\\\\\",\\\\\\\"material_id\\\\\\":\\\\\\"76021851748687055880600\\\\\\",\\\\\\\"material_type\\\\\\":\\\\\\"video\\\\\\",\\\\\\\"name\\\\\\":\\\\\\"d4zar14d.5ce\\\\\\",\\\\\\\"operate_status\\\\\\\":1,\\\\\\\"origin_url\\\\\\":\\\\\\"http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460\\\\\\\\u0026OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1\\\\\\\\u0026Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw%3D\\\\\\",\\\\\\\"photo_info\\\\\\\":null,\\\\\\\"shop_id\\\\\\\":255995600,\\\\\\\"size\\\\\\\":998,\\\\\\\"update_time\\\\\\":\\\\\\"2026-02-02 16:41:14\\\\\\",\\\\\\\"video_info\\\\\\":{\\\\\\\"duration\\\\\\\":10,\\\\\\\"format\\\\\\":\\\\\\"mp4\\\\\\",\\\\\\\"height\\\\\\\":800,\\\\\\\"vid\\\\\\":\\\\\\"v0d27cg10001d60668qljht3i3nh5e10\\\\\\",\\\\\\\"width\\\\\\\":800}}\\"}]`;

const placeholder = '\u0000QUOTE\u0000';
let unescaped = input
    .replace(/\\\\\"/g, placeholder)
    .replace(/\\"/g, '"')
    .replace(new RegExp(placeholder, 'g'), '\\"');

console.log('Position 121:', unescaped.substring(115, 130));
console.log('Character at 121:', unescaped[121], '(code:', unescaped.charCodeAt(121), ')');

// Let me try a different approach - just replace \" with "
let simple = input.replace(/\\"/g, '"');
console.log('\n\nSimple replace result:');
console.log(simple.substring(0, 200));

try {
    JSON.parse(simple);
    console.log('\nSimple replace works!');
} catch (e) {
    console.log('\nSimple replace error:', e.message);
}
