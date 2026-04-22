// Test multiple replacements
const input = `[{\\"tag\\":\\"137\\",\\"msg_id\\":\\"88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168\\",\\"data\\":\\"{\\\\\\\"audit_status\\\\\\\":3,\\\\\\\"audit_status_desc\\\\\\":\\\\\\"\\\\\\",\\\\\\\"byte_url\\\\\\":\\\\\\"\\\\\\",\\\\\\\"create_time\\\\\\":\\\\\\"2026-02-02 16:41:07\\\\\\",\\\\\\\"delete_time\\\\\\":\\\\\\"\\\\\\",\\\\\\\"folder_id\\\\\\":\\\\\\"75765752952458775141600\\\\\\",\\\\\\\"material_id\\\\\\":\\\\\\"76021851748687055880600\\\\\\",\\\\\\\"material_type\\\\\\":\\\\\\"video\\\\\\",\\\\\\\"name\\\\\\":\\\\\\"d4zar14d.5ce\\\\\\",\\\\\\\"operate_status\\\\\\\":1,\\\\\\\"origin_url\\\\\\":\\\\\\"http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460\\\\\\\\u0026OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1\\\\\\\\u0026Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw%3D\\\\\\",\\\\\\\"photo_info\\\\\\\":null,\\\\\\\"shop_id\\\\\\\":255995600,\\\\\\\"size\\\\\\\":998,\\\\\\\"update_time\\\\\\":\\\\\\"2026-02-02 16:41:14\\\\\\",\\\\\\\"video_info\\\\\\":{\\\\\\\"duration\\\\\\\":10,\\\\\\\"format\\\\\\":\\\\\\"mp4\\\\\\",\\\\\\\"height\\\\\\\":800,\\\\\\\"vid\\\\\\":\\\\\\"v0d27cg10001d60668qljht3i3nh5e10\\\\\\",\\\\\\\"width\\\\\\\":800}}\\"}]`;

let unescaped = input;
let iterations = 0;
const maxIterations = 10;

// Keep replacing until no more \" found or max iterations reached
while (unescaped.includes('\\"') && iterations < maxIterations) {
    unescaped = unescaped.replace(/\\"/g, '"');
    iterations++;
    console.log(`Iteration ${iterations}: Contains \\\\"? ${unescaped.includes('\\"')}`);
}

console.log(`\nTotal iterations: ${iterations}`);
console.log('\nFinal result (first 200 chars):');
console.log(unescaped.substring(0, 200));

try {
    const parsed = JSON.parse(unescaped);
    console.log('\n✅ Parsed successfully!');
    console.log('\nFormatted output:');
    console.log(JSON.stringify(parsed, null, 2));
} catch (e) {
    console.log('\n❌ Parse error:', e.message);
}
