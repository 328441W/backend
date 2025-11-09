// 仅引入必要依赖（无额外新增）
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

// 初始化服务器（极简配置）
const app = express();
const port = 8780; // 固定常用端口，方便前端对接
const CONTACTS_FILE = path.join(__dirname, 'data', 'contacts.json');

// 基础中间件（解决跨域、解析请求体，无多余配置）
app.use(cors()); // 允许所有跨域请求（简化配置，避免拦截）
app.use(bodyParser.json()); // 仅解析JSON请求体（满足前端需求）

// ===================== 核心工具函数（极简实现）=====================
// 读取联系人：文件不存在则自动创建，格式错误则重置
async function readContacts() {
  try {
    // 确保data文件夹存在
    await fs.mkdir(path.dirname(CONTACTS_FILE), { recursive: true });
    // 读取文件，不存在则创建空数组
    const data = await fs.readFile(CONTACTS_FILE, 'utf8').catch(() => '[]');
    // JSON解析失败则重置为空数组
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('读取失败：', err.message);
    return [];
  }
}

// 写入联系人：直接写入，简化原子操作（降低复杂度）
async function writeContacts(contacts) {
  try {
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
    return true;
  } catch (err) {
    console.error('写入失败：', err.message);
    return false;
  }
}

// ===================== 核心API接口（逻辑扁平化）=====================
// 1. 获取所有联系人（GET）
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await readContacts();
    res.json({ success: true, message: '获取成功', data: { contacts } });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 2. 获取单个联系人（用于修改，GET）
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contacts = await readContacts();
    const contact = contacts.find(c => c.id === req.params.id);
    if (contact) {
      res.json({ success: true, message: '获取成功', data: { contact } });
    } else {
      res.status(404).json({ success: false, message: '联系人不存在' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 3. 添加联系人（POST）
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, phone } = req.body;
    // 基础校验（避免无效数据）
    if (!name.trim() || !phone.trim()) {
      return res.status(400).json({ success: false, message: '姓名和手机号不能为空' });
    }

    const contacts = await readContacts();
    // 新增联系人（简单ID生成）
    const newContact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim()
    };

    contacts.push(newContact);
    const success = await writeContacts(contacts);
    if (success) {
      res.status(201).json({ success: true, message: '添加成功', data: { contact: newContact } });
    } else {
      res.status(500).json({ success: false, message: '添加失败' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '添加失败' });
  }
});

// 4. 修改联系人（PUT）
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    // 基础校验
    if (!id || !name.trim() || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'ID、姓名和手机号不能为空' });
    }

    const contacts = await readContacts();
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: '联系人不存在' });
    }

    // 更新联系人
    contacts[index] = { id, name: name.trim(), phone: phone.trim() };
    const success = await writeContacts(contacts);
    if (success) {
      res.json({ success: true, message: '修改成功', data: { contact: contacts[index] } });
    } else {
      res.status(500).json({ success: false, message: '修改失败' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '修改失败' });
  }
});

// 5. 删除联系人（DELETE）
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID不能为空' });
    }

    const contacts = await readContacts();
    const newContacts = contacts.filter(c => c.id !== id);
    if (newContacts.length === contacts.length) {
      return res.status(404).json({ success: false, message: '联系人不存在' });
    }

    const success = await writeContacts(newContacts);
    if (success) {
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(500).json({ success: false, message: '删除失败' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// ===================== 启动服务器（简洁日志）=====================
app.listen(port, () => {
  console.log(`后端启动成功！`);
  console.log(`接口地址：http://localhost:${port}/api/contacts`);
  console.log(`数据文件：${CONTACTS_FILE}`);
});