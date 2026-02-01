import fs from "fs"
import path from "path"

const CONTENT_DIR = "content"

/**
 * 递归获取目录下所有文件
 */
function getFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const name = path.join(dir, file)
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, allFiles)
    } else if (file.endsWith(".md")) {
      allFiles.push(name)
    }
  }
  return allFiles
}

function pangu(text) {
  // 使用正则分割代码块，只处理非代码块部分
  // 匹配 ```...``` (包括多行)
  const parts = text.split(/(```[\s\S]*?```)/g)
  
  return parts.map(part => {
    // 如果是代码块部分（以 ``` 开头），原样返回
    if (part.startsWith("```")) {
      return part
    }
    
    // 否则进行中英文空格处理
    let processed = part.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, "$1 $2")
    processed = processed.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, "$1 $2")
    return processed
  }).join("")
}

function processFiles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Error: Directory ${CONTENT_DIR} not found.`)
    return
  }

  const files = getFiles(CONTENT_DIR)
  console.log(`Found ${files.length} markdown files.`)

  let changedCount = 0
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8")
    const newContent = pangu(content)

    if (content !== newContent) {
      fs.writeFileSync(file, newContent, "utf-8")
      console.log(`Updated: ${file}`)
      changedCount++
    }
  }

  console.log(`Done! Updated ${changedCount} files.`)
}

processFiles()
