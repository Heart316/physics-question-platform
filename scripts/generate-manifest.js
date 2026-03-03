const fs = require('fs');
const path = require('path');

const problemDir = './problem';
const manifestFile = './manifest.json';

function calculateDifficulty(data) {
    const textLength = (data.problem_text_cn || "").length + (data.problem_solution_cn || "").length;
    const hasFormulas = (data.problem_text_cn && data.problem_text_cn.includes('$')) || 
                       (data.problem_solution_cn && data.problem_solution_cn.includes('$'));
    const tagCount = (data.problem_tags || []).length;
    const hasImages = (data.problem_img && data.problem_img.length > 0);
    
    let difficulty = 2;
    if (textLength > 800) difficulty += 1;
    if (hasFormulas) difficulty += 1;
    if (tagCount >= 2) difficulty += 0.5;
    if (hasImages) difficulty += 0.5;
    
    return Math.min(5, Math.max(1, Math.round(difficulty)));
}

function extractPreview(text) {
    if (!text) return '';
    const clean = text.replace(/\$.*?\$/g, '').replace(/\n/g, ' ').trim();
    return clean.length > 20 ? clean.substring(0, 20) + '...' : clean;
}

// 读取所有jsonl文件
const files = fs.readdirSync(problemDir).filter(f => f.endsWith('.jsonl')).sort();
const manifest = [];

console.log(`找到 ${files.length} 个文件`);

files.forEach(file => {
    try {
        const id = parseInt(file.replace('.jsonl', ''));
        const content = fs.readFileSync(path.join(problemDir, file), 'utf8');
        const data = JSON.parse(content);
        
        manifest.push({
            id: id,
            problem_id: data.problem_id || `PROB-${id}`,
            title_preview: extractPreview(data.problem_text_cn),
            tags: data.problem_tags || [],
            difficulty: calculateDifficulty(data),
            has_image: !!(data.problem_img && data.problem_img.length > 0)
        });
        
        console.log(`✅ 处理: ${file}`);
    } catch (e) {
        console.log(`❌ 跳过: ${file} - ${e.message}`);
    }
});

// 按ID排序
manifest.sort((a, b) => a.id - b.id);

// 写入文件
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log(`✨ 完成！共生成 ${manifest.length} 条记录`);
