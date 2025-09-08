// post.js - 增强版文章页面脚本，包含编辑功能

document.addEventListener('DOMContentLoaded', function() {
  // ===================== 基础元素获取 =====================
  const tocLinks = document.querySelectorAll('.toc a');
  const headers = document.querySelectorAll('.content h1[id], .content h2[id]');
  
  // 编辑相关元素
  const toggleEditBtn = document.getElementById('toggle-edit');
  const savePostBtn = document.getElementById('save-post');
  const postContent = document.getElementById('post-content');
  const postEditor = document.getElementById('post-editor');
  const postPreview = document.getElementById('post-preview');
  const markdownEditor = document.getElementById('markdown-editor');
  const previewContent = document.getElementById('preview-content');
  const postMetaEdit = document.getElementById('post-meta-edit');
  const editToolbar = document.getElementById('edit-toolbar');
  
  let isEditMode = false;
  let isPreviewMode = false;
  
  // ===================== 目录功能 =====================
  function initTOC() {
    // 点击跳转功能
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        
        if (!targetId.startsWith('#') || targetId === '#') {
          return;
        }
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          
          // 平滑滚动到目标位置
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // 高亮当前选中的目录项
          tocLinks.forEach(l => l.classList.remove('active'));
          this.classList.add('active');
        }
      });
    });

    // 使用Intersection Observer来检测标题元素的可见性
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -80% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          
          // 移除所有高亮
          tocLinks.forEach(link => link.classList.remove('active'));
          
          // 为当前标题对应的目录项添加高亮
          const activeLink = document.querySelector(`.toc a[href="#${currentId}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
            
            // 确保高亮的目录项在视口中可见
            activeLink.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      });
    }, observerOptions);

    // 观察所有标题元素
    headers.forEach(header => {
      observer.observe(header);
    });
    
    // 初始化高亮第一个目录项
    if (tocLinks.length > 0 && headers.length > 0) {
      tocLinks[0].classList.add('active');
    }
  }

  // ===================== 编辑模式切换 =====================
  function toggleEditMode() {
    isEditMode = !isEditMode;
    document.body.classList.toggle('edit-mode', isEditMode);
    
    if (isEditMode) {
      // 进入编辑模式
      toggleEditBtn.classList.add('active');
      toggleEditBtn.querySelector('.edit-text').textContent = '取消';
      savePostBtn.style.display = 'flex';
      postMetaEdit.style.display = 'block';
      editToolbar.style.display = 'flex';
      postContent.style.display = 'none';
      postEditor.style.display = 'block';
      
      // 设置编辑器内容
      if (markdownEditor && !markdownEditor.value.trim()) {
        markdownEditor.value = postContent.innerHTML;
      }
      
      // 聚焦编辑器
      setTimeout(() => {
        markdownEditor.focus();
      }, 100);
      
    } else {
      // 退出编辑模式
      toggleEditBtn.classList.remove('active');
      toggleEditBtn.querySelector('.edit-text').textContent = '编辑';
      savePostBtn.style.display = 'none';
      postMetaEdit.style.display = 'none';
      editToolbar.style.display = 'none';
      postContent.style.display = 'block';
      postEditor.style.display = 'none';
      postPreview.style.display = 'none';
      isPreviewMode = false;
    }
  }

  // ===================== 预览功能 =====================
  function togglePreview() {
    if (!isEditMode) return;
    
    isPreviewMode = !isPreviewMode;
    
    if (isPreviewMode) {
      postEditor.style.display = 'none';
      postPreview.style.display = 'block';
      updatePreview();
      
      // 更新按钮状态
      document.querySelector('[data-action="preview"]').classList.add('active');
    } else {
      postEditor.style.display = 'block';
      postPreview.style.display = 'none';
      
      // 更新按钮状态
      document.querySelector('[data-action="preview"]').classList.remove('active');
    }
  }

  function updatePreview() {
    if (!markdownEditor || !previewContent) return;
    
    const markdownText = markdownEditor.value;
    
    // 简单的Markdown渲染（实际项目中建议使用marked.js等库）
    let html = markdownText
      // 标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // 行内代码
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      // 代码块
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      // 图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />')
      // 引用
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // 段落
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br />');
    
    // 包装段落
    if (html && !html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    previewContent.innerHTML = html || '<p class="preview-placeholder">预览将显示在这里...</p>';
  }

  // ===================== 工具栏功能 =====================
  function initToolbar() {
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    
    toolbarButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const action = this.dataset.action;
        handleToolbarAction(action);
      });
    });
  }

  function handleToolbarAction(action) {
    if (!markdownEditor) return;
    
    const textarea = markdownEditor;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let replacement = '';
    let cursorOffset = 0;
    
    switch (action) {
      case 'bold':
        replacement = `**${selectedText || '粗体文本'}**`;
        cursorOffset = selectedText ? 0 : -2;
        break;
        
      case 'italic':
        replacement = `*${selectedText || '斜体文本'}*`;
        cursorOffset = selectedText ? 0 : -1;
        break;
        
      case 'code':
        replacement = `\`${selectedText || '代码'}\``;
        cursorOffset = selectedText ? 0 : -1;
        break;
        
      case 'heading1':
        replacement = `# ${selectedText || '标题1'}`;
        cursorOffset = selectedText ? 0 : 0;
        break;
        
      case 'heading2':
        replacement = `## ${selectedText || '标题2'}`;
        cursorOffset = selectedText ? 0 : 0;
        break;
        
      case 'heading3':
        replacement = `### ${selectedText || '标题3'}`;
        cursorOffset = selectedText ? 0 : 0;
        break;
        
      case 'link':
        showLinkModal();
        return;
        
      case 'image':
        showImageModal();
        return;
        
      case 'quote':
        replacement = `> ${selectedText || '引用文本'}`;
        cursorOffset = selectedText ? 0 : 0;
        break;
        
      case 'list':
        replacement = `- ${selectedText || '列表项'}`;
        cursorOffset = selectedText ? 0 : 0;
        break;
        
      case 'codeblock':
        replacement = `\`\`\`\n${selectedText || '代码块'}\n\`\`\``;
        cursorOffset = selectedText ? 0 : -4;
        break;
        
      case 'preview':
        togglePreview();
        return;
    }
    
    // 插入文本
    insertTextAtCursor(textarea, replacement, cursorOffset);
  }

  function insertTextAtCursor(textarea, text, cursorOffset = 0) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    
    const newCursorPos = start + text.length + cursorOffset;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
    
    // 更新字数统计
    updateWordCount();
  }

  // ===================== 字数统计 =====================
  function updateWordCount() {
    if (!markdownEditor) return;
    
    const text = markdownEditor.value;
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    const charCountEl = document.getElementById('char-count');
    const wordCountEl = document.getElementById('word-count');
    
    if (charCountEl) charCountEl.textContent = charCount;
    if (wordCountEl) wordCountEl.textContent = wordCount;
  }

  // ===================== 图片上传功能 =====================
  function initImageUpload() {
    const imageUpload = document.getElementById('image-upload');
    const uploadZone = document.getElementById('upload-zone');
    const uploadedImages = document.getElementById('uploaded-images');
    
    if (!imageUpload || !uploadZone) return;
    
    // 点击上传区域触发文件选择
    uploadZone.addEventListener('click', () => {
      imageUpload.click();
    });
    
    // 文件选择处理
    imageUpload.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    uploadFiles(files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  }

  function uploadFiles(files) {
    const uploadedImages = document.getElementById('uploaded-images');
    if (!uploadedImages) return;
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showMessage('只能上传图片文件', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showMessage('图片大小不能超过5MB', 'error');
        return;
      }
      
      // 创建预览
      const reader = new FileReader();
      reader.onload = function(e) {
        createImagePreview(e.target.result, file.name);
      };
      reader.readAsDataURL(file);
      
      // 这里应该实现实际的上传逻辑
      // uploadToServer(file);
    });
  }

  function createImagePreview(src, name) {
    const uploadedImages = document.getElementById('uploaded-images');
    if (!uploadedImages) return;
    
    const imageDiv = document.createElement('div');
    imageDiv.className = 'uploaded-image';
    imageDiv.innerHTML = `
      <img src="${src}" alt="${name}">
      <div class="image-name">${name}</div>
      <div class="image-actions">
        <button type="button" class="btn-insert" onclick="insertImageToEditor('${src}', '${name}')">插入</button>
        <button type="button" class="btn-copy" onclick="copyImageUrl('${src}')">复制</button>
      </div>
    `;
    
    uploadedImages.appendChild(imageDiv);
  }

  // ===================== 模态框功能 =====================
  function showImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
      modal.style.display = 'flex';
      
      // 初始化标签页
      initImageModalTabs();
    }
  }

  function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function initImageModalTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const targetTab = this.dataset.tab;
        
        // 更新按钮状态
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // 显示对应内容
        tabContents.forEach(content => {
          content.style.display = content.id === `${targetTab}-tab` ? 'block' : 'none';
        });
      });
    });
  }

  function showLinkModal() {
    const modal = document.getElementById('link-modal');
    if (modal) {
      modal.style.display = 'flex';
      
      // 如果有选中文本，自动填入
      const selectedText = getSelectedText();
      if (selectedText) {
        document.getElementById('link-text').value = selectedText;
      }
    }
  }

  function closeLinkModal() {
    const modal = document.getElementById('link-modal');
    if (modal) {
      modal.style.display = 'none';
      document.getElementById('link-text').value = '';
      document.getElementById('link-url').value = '';
    }
  }

  function getSelectedText() {
    if (!markdownEditor) return '';
    
    const start = markdownEditor.selectionStart;
    const end = markdownEditor.selectionEnd;
    return markdownEditor.value.substring(start, end);
  }

  // ===================== 保存功能 =====================
  function savePost() {
    if (!isEditMode) return;
    
    // 获取所有编辑的数据
    const postData = {
      title: document.getElementById('edit-title')?.value || '',
      content: markdownEditor?.value || '',
      categories: document.getElementById('edit-categories')?.value || '',
      tags: document.getElementById('edit-tags')?.value || '',
      thumbnail: document.getElementById('edit-thumbnail')?.value || '',
      date: document.getElementById('edit-date')?.value || ''
    };
    
    // 显示保存状态
    document.body.classList.add('saving');
    savePostBtn.querySelector('.save-text').textContent = '保存中...';
    
    // 模拟保存请求
    setTimeout(() => {
      // 这里应该发送实际的保存请求到服务器
      console.log('保存文章数据:', postData);
      
      // 保存成功
      document.body.classList.remove('saving');
      savePostBtn.querySelector('.save-text').textContent = '保存';
      showMessage('文章保存成功！', 'success');
      
      // 可选：退出编辑模式
      // toggleEditMode();
    }, 1000);
  }

  // ===================== 全局函数 ===================== 
  window.insertImageToEditor = function(src, alt) {
    if (!markdownEditor) return;
    
    const imageMarkdown = `![${alt || ''}](${src})`;
    insertTextAtCursor(markdownEditor, imageMarkdown);
    closeImageModal();
  };

  window.copyImageUrl = function(src) {
    navigator.clipboard.writeText(src).then(() => {
      showMessage('图片链接已复制到剪贴板', 'success');
    });
  };

  window.insertImageUrl = function() {
    const url = document.getElementById('image-url')?.value;
    const alt = document.getElementById('image-alt')?.value;
    
    if (!url) {
      showMessage('请输入图片链接', 'error');
      return;
    }
    
    insertImageToEditor(url, alt);
  };

  window.insertLink = function() {
    const text = document.getElementById('link-text')?.value;
    const url = document.getElementById('link-url')?.value;
    
    if (!url) {
      showMessage('请输入链接地址', 'error');
      return;
    }
    
    const linkMarkdown = `[${text || url}](${url})`;
    insertTextAtCursor(markdownEditor, linkMarkdown);
    closeLinkModal();
  };

  window.closeImageModal = closeImageModal;
  window.closeLinkModal = closeLinkModal;

  // ===================== 消息提示 =====================
  function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `success-message ${type}`;
    message.textContent = text;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }

  // ===================== 键盘快捷键 =====================
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      if (!isEditMode) return;
      
      // Ctrl+S 保存
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        savePost();
      }
      
      // Ctrl+B 粗体
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        handleToolbarAction('bold');
      }
      
      // Ctrl+I 斜体
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        handleToolbarAction('italic');
      }
      
      // Esc 退出编辑模式
      if (e.key === 'Escape') {
        if (document.getElementById('image-modal').style.display === 'flex') {
          closeImageModal();
        } else if (document.getElementById('link-modal').style.display === 'flex') {
          closeLinkModal();
        } else {
          toggleEditMode();
        }
      }
    });
  }

  // ===================== 事件监听器 =====================
  if (toggleEditBtn) {
    toggleEditBtn.addEventListener('click', toggleEditMode);
  }
  
  if (savePostBtn) {
    savePostBtn.addEventListener('click', savePost);
  }
  
  if (markdownEditor) {
    markdownEditor.addEventListener('input', updateWordCount);
    markdownEditor.addEventListener('input', updatePreview);
  }
  
  if (document.getElementById('refresh-preview')) {
    document.getElementById('refresh-preview').addEventListener('click', updatePreview);
  }

  // ===================== 初始化 =====================
  initTOC();
  initToolbar();
  initImageUpload();
  initKeyboardShortcuts();
  updateWordCount();
  
  console.log('文章页面加载完成，编辑功能已启用');
});