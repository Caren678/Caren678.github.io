# The world of paper-cuts

这是一个适合比赛展示的 **GitHub Pages + Firebase** 静态网站项目。

它可以做到：
- 长期网址：部署到 GitHub Pages 后，网址不会像临时预览链接那样过期
- 学生上传图片
- 自动去除浅色背景（更适合白底 / 浅色背景照片）
- 选择 fly / jump / run / spin / my own action
- 作品进入同一个共享展板，彼此可见
- Firebase 配好后，多设备共享同一个展板

## 一、文件说明

- `index.html`：首页
- `styles.css`：样式
- `js/app.js`：页面逻辑
- `js/firebase-config.js`：Firebase 配置文件（需要你自己填）
- `js/firebase-config.sample.js`：配置示例
- `firestore.rules`：Firestore 安全规则
- `storage.rules`：Storage 安全规则
- `.nojekyll`：让 GitHub Pages 按普通静态站点发布

## 二、先部署到 GitHub Pages

### 1. 创建 GitHub 仓库
建议仓库名：
`the-world-of-paper-cuts`

### 2. 上传全部文件
把这个压缩包解压后，把里面全部文件上传到仓库根目录。

### 3. 开启 GitHub Pages
进入仓库：
- `Settings`
- `Pages`
- `Build and deployment`
- `Source` 选 `Deploy from a branch`
- Branch 选 `main`
- Folder 选 `/ (root)`
- 保存

几分钟后，GitHub 会给你一个长期网址，格式通常像：
`https://你的用户名.github.io/the-world-of-paper-cuts/`

## 三、再配置 Firebase

### 1. 创建 Firebase 项目
在 Firebase 控制台新建项目。

### 2. 添加 Web App
在项目中添加一个 Web 应用。
添加后会拿到一组 `firebaseConfig`。

### 3. 把配置填进文件
打开：
`js/firebase-config.js`
把里面空白配置替换成你自己的。

### 4. 开启匿名登录
进入 Firebase 控制台：
- `Authentication`
- `Sign-in method`
- 开启 `Anonymous`

这样学生不用注册，也能上传作品。

### 5. 开启 Firestore
进入：
- `Firestore Database`
- 创建数据库

然后把项目里的 `firestore.rules` 内容复制进去发布。

### 6. 开启 Storage
进入：
- `Storage`
- 开启存储桶

然后把项目里的 `storage.rules` 内容复制进去发布。

## 四、上传后为什么大家都能看到

- 图片会上传到 Firebase Storage
- 标题、名字、动作、句子等信息会写入 Firestore
- 页面会实时监听 Firestore 里的作品数据
- 所以只要是打开同一个网址的人，都能看到同一个展板

## 五、自动抠图说明

这个版本的“自动抠图”是浏览器端完成的，适合：
- 白纸背景
- 很浅的纯色背景
- 光线比较亮
- 剪纸主体和背景对比明显

如果背景太花，边缘可能会不够干净。

比赛展示时，建议准备几张：
- 放在白纸上拍的剪纸照片
- 轮廓比较清楚
- 主体不要太小

## 六、如果你现在只想先看效果

如果 `js/firebase-config.js` 里还是空的，网站会自动进入：
**Local demo mode**

这个模式下：
- 作品只保存在当前浏览器
- 不会跨设备同步
- 适合先试页面效果

## 七、比赛使用建议

最稳的方式：
1. 先把 GitHub Pages 网址写进材料
2. 再录一段微课视频，演示：上传 → 自动抠图 → 动起来 → 进入展板
3. 准备几张白底剪纸图片现场测试

## 八、你接下来真正要做的事

1. 上传到 GitHub 仓库
2. 打开 GitHub Pages
3. 建 Firebase 项目
4. 把 Firebase 配置填进 `js/firebase-config.js`
5. 开启匿名登录、Firestore、Storage
6. 粘贴规则
7. 再回 GitHub Pages 打开网址测试

---

如果你要更适合比赛一点，还可以继续改：
- 换成更童真的配色
- 预放几张示例学生作品
- 加中文说明页
- 加“评委体验说明”按钮
