import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Key, 
  LogOut, 
  Copy, 
  Check, 
  ImageIcon, 
  Settings,
  AlertCircle,
  FolderPlus,
  UserPlus,
  Download,
  Upload,
  Link as LinkIcon,
  LayoutGrid,
  ShieldCheck,
  Zap,
  ArrowRight,
  Menu,
  X,
  Code,
  Palette,
  Sparkles,
  GraduationCap,
  Users,
  Database,
  Layers,
  FileJson
} from 'lucide-react';

interface LinkItem {
  id: string;
  imageUrl: string;
  category: string;
  type?: 'link' | 'photo';
  username?: string;
  createdAt: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string; name: string } | null>(null);

  // Active Page: 'links' or 'photos'
  const [activeTab, setActiveTab] = useState<'links' | 'photos'>('links');

  // Landing page view mode or auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // App state
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [photos, setPhotos] = useState<LinkItem[]>([]);
  
  // Independent categories for links and photos
  const [linkCategories, setLinkCategories] = useState<string[]>([]);
  const [photoCategories, setPhotoCategories] = useState<string[]>([]);
  
  // Link vault input state
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Photo gallery input state
  const [photoInputMode, setPhotoInputMode] = useState<'url' | 'file'>('file');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoFileInput, setPhotoFileInput] = useState<File | null>(null);
  const [photoCategory, setPhotoCategory] = useState('');
  const [photoFilter, setPhotoFilter] = useState('All');

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingPhoto, setSubmittingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [photoErrorMsg, setPhotoErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  // Add category popup state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [targetCategorySetter, setTargetCategorySetter] = useState<'link' | 'photo'>('link');

  // Password change modal state
  const [showSettings, setShowSettings] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');

  // Scroll listener for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('avtars_auth');
    const savedUser = localStorage.getItem('avtars_user');
    if (savedAuth === 'true' && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setUser(parsed);
        fetchData(parsed.username);
      } catch {
        handleLogout();
      }
    }
  }, []);

  const fetchData = async (currentUsername?: string) => {
    const uname = currentUsername || user?.username;
    if (!uname) return;

    setLoadingData(true);
    try {
      const headers = { 'x-username': uname };
      const [linksRes, photosRes, linkCatsRes, photoCatsRes] = await Promise.all([
        fetch(`/api/links?type=link&username=${encodeURIComponent(uname)}`, { headers }),
        fetch(`/api/links?type=photo&username=${encodeURIComponent(uname)}`, { headers }),
        fetch(`/api/categories?type=link&username=${encodeURIComponent(uname)}`, { headers }),
        fetch(`/api/categories?type=photo&username=${encodeURIComponent(uname)}`, { headers })
      ]);
      const linksData = await linksRes.json();
      const photosData = await photosRes.json();
      const linkCatsData = await linkCatsRes.json();
      const photoCatsData = await photoCatsRes.json();

      setLinks(Array.isArray(linksData) ? linksData : []);
      setPhotos(Array.isArray(photosData) ? photosData : []);
      
      if (Array.isArray(linkCatsData) && linkCatsData.length > 0) {
        setLinkCategories(linkCatsData);
        setSelectedCategory(linkCatsData[0]);
      } else {
        setLinkCategories(['General', 'Design', 'Inspiration']);
        setSelectedCategory('General');
      }

      if (Array.isArray(photoCatsData) && photoCatsData.length > 0) {
        setPhotoCategories(photoCatsData);
        setPhotoCategory(photoCatsData[0]);
      } else {
        setPhotoCategories(['General', 'Photography', 'Portraits']);
        setPhotoCategory('General');
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoadingAuth(true);

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = authMode === 'register' 
      ? { username: usernameInput, password: passwordInput, name: nameInput }
      : { username: usernameInput, password: passwordInput };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setUser(data.user);
        setAuthModalOpen(false);
        localStorage.setItem('avtars_auth', 'true');
        localStorage.setItem('avtars_user', JSON.stringify(data.user));
        
        setActiveFilter('All');
        setPhotoFilter('All');
        setImageUrlInput('');
        setPhotoUrlInput('');
        setPhotoFileInput(null);

        fetchData(data.user.username);
      } else {
        setAuthError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setLinks([]);
    setPhotos([]);
    setLinkCategories([]);
    setPhotoCategories([]);
    setActiveFilter('All');
    setPhotoFilter('All');
    localStorage.removeItem('avtars_auth');
    localStorage.removeItem('avtars_user');
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName || !user?.username) return;
    setCategoryError('');

    if (targetCategorySetter === 'link') {
      if (!linkCategories.includes(catName)) {
        setLinkCategories([...linkCategories, catName]);
      }
      setSelectedCategory(catName);
    } else {
      if (!photoCategories.includes(catName)) {
        setPhotoCategories([...photoCategories, catName]);
      }
      setPhotoCategory(catName);
    }
    setNewCategoryName('');
    setShowAddCategoryModal(false);

    // Sync in background
    fetch('/api/categories', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': user.username
      },
      body: JSON.stringify({ 
        name: catName,
        type: targetCategorySetter,
        username: user.username
      }),
    }).catch(() => {});
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const url = imageUrlInput.trim();
    if (!url || !user?.username) return;

    setErrorMsg('');

    if (links.some(l => l.imageUrl === url)) {
      setErrorMsg('This image link is already in your dashboard.');
      return;
    }

    const tempId = 'item_' + Date.now();
    const newLinkItem = {
      id: tempId,
      username: user.username,
      imageUrl: url,
      category: selectedCategory || linkCategories[0] || 'General',
      type: 'link' as const,
      createdAt: new Date().toISOString()
    };

    setLinks([newLinkItem, ...links]);
    setImageUrlInput('');
    setPreviewError(false);

    fetch('/api/links', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': user.username
      },
      body: JSON.stringify({ 
        imageUrl: url,
        category: selectedCategory || linkCategories[0] || 'General',
        type: 'link',
        username: user.username
      }),
    }).then(async res => {
      const data = await res.json();
      if (!data.success) {
        if (data.message && data.message.includes('already')) {
          setErrorMsg(data.message);
          setLinks(prev => prev.filter(l => l.id !== tempId));
        }
      } else if (data.link) {
        setLinks(prev => prev.map(l => l.id === tempId ? data.link : l));
      }
    }).catch(() => {});
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.username) return;
    setPhotoErrorMsg('');

    let payload: any = {
      category: photoCategory || photoCategories[0] || 'General',
      type: 'photo',
      username: user.username
    };

    if (photoInputMode === 'url') {
      const url = photoUrlInput.trim();
      if (!url) return;
      if (photos.some(p => p.imageUrl === url)) {
        setPhotoErrorMsg('This image is already in your dashboard.');
        return;
      }
      payload.imageUrl = url;
    } else {
      if (!photoFileInput) return;
    }

    let base64 = '';
    if (photoInputMode === 'file' && photoFileInput) {
      try {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(photoFileInput!);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        payload.fileBase64 = base64;
      } catch (err) {
        setPhotoErrorMsg('Failed to read image file');
        return;
      }
    }

    const tempId = 'photo_' + Date.now();
    const optimisticUrl = photoInputMode === 'url' ? photoUrlInput.trim() : (base64 || '');
    const newPhotoItem = {
      id: tempId,
      username: user.username,
      imageUrl: optimisticUrl,
      category: photoCategory || photoCategories[0] || 'General',
      type: 'photo' as const,
      createdAt: new Date().toISOString()
    };

    if (optimisticUrl) {
      setPhotos([newPhotoItem, ...photos]);
    }
    setPhotoUrlInput('');
    setPhotoFileInput(null);

    fetch('/api/links', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': user.username
      },
      body: JSON.stringify(payload),
    }).then(async res => {
      const data = await res.json();
      if (!data.success) {
        setPhotoErrorMsg(data.message || 'Failed to upload photo');
        setPhotos(prev => prev.filter(p => p.id !== tempId));
      } else if (data.link) {
        setPhotos(prev => prev.map(p => p.id === tempId ? data.link : p));
      }
    }).catch(() => {
      setPhotoErrorMsg('Failed to upload photo');
      setPhotos(prev => prev.filter(p => p.id !== tempId));
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadJson = (items: LinkItem[], filterName: string, prefix: string) => {
    const dataToExport = items.map(l => ({
      id: l.id,
      imageUrl: l.imageUrl,
      category: l.category,
      createdAt: l.createdAt
    }));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `avtars_${prefix}_${filterName.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg('');
    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username,
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMsg('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => setShowSettings(false), 1500);
      } else {
        setSettingsMsg(data.message || 'Failed to update password');
      }
    } catch (err) {
      setSettingsMsg('Error updating password');
    }
  };

  const filteredLinks = activeFilter === 'All' 
    ? links 
    : links.filter(l => l.category === activeFilter);

  const filteredPhotos = photoFilter === 'All'
    ? photos
    : photos.filter(p => p.category === photoFilter);

  const truncateUrl = (url: string) => {
    if (url.length <= 50) return url;
    return url.substring(0, 47) + '...';
  };

  // If not authenticated, render the premium white-themed landing page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
        {/* Navbar */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-neutral-200 shadow-xs' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <a href="#" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="Avtars Logo" className="w-8 h-8 object-contain rounded transition-transform group-hover:scale-105" />
              <span className="text-base font-bold tracking-tight text-neutral-900">Avtars</span>
            </a>

            <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-neutral-600">
              <a href="#features" className="hover:text-neutral-900 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-neutral-900 transition-colors">How it works</a>
              <a href="#security" className="hover:text-neutral-900 transition-colors">Security</a>
              <a href="#use-cases" className="hover:text-neutral-900 transition-colors">Use cases</a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => { setAuthMode('login'); setAuthModalOpen(true); setAuthError(''); }}
                className="text-xs font-medium text-neutral-700 hover:text-neutral-900 transition-colors px-4 py-2"
              >
                Sign in
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthModalOpen(true); setAuthError(''); }}
                className="text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-all px-4 py-2.5 rounded-full flex items-center gap-1.5 group cursor-pointer shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Mobile hamburger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-700 hover:text-neutral-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-neutral-200 px-6 py-6 space-y-4 shadow-lg">
              <nav className="flex flex-col space-y-3 text-sm text-neutral-700 font-medium">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-900">Features</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-900">How it works</a>
                <a href="#security" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-900">Security</a>
                <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-900">Use cases</a>
              </nav>
              <div className="pt-4 border-t border-neutral-200 flex flex-col gap-3">
                <button
                  onClick={() => { setAuthMode('login'); setAuthModalOpen(true); setAuthError(''); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center text-xs font-medium text-neutral-900 border border-neutral-300 rounded-full"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setAuthModalOpen(true); setAuthError(''); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center text-xs font-medium bg-neutral-900 text-white rounded-full"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-mono tracking-wider uppercase text-neutral-700 mb-8 animate-fade-in shadow-xs">
            <span>YOUR PERSONAL IMAGE VAULT</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-900 max-w-4xl leading-[1.08] mb-6">
            Every image.<br />
            <span className="text-neutral-500">One beautifully simple vault.</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mb-10 leading-relaxed">
            Store image links, upload photos, organize everything, and access your media whenever you need it with zero clutter.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full sm:w-auto">
            <button
              onClick={() => { setAuthMode('register'); setAuthModalOpen(true); }}
              className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-all text-xs font-semibold rounded-full flex items-center justify-center gap-2 group cursor-pointer shadow-md shadow-black/5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 transition-all text-xs font-semibold rounded-full flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 font-mono">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-neutral-900" /> No complicated setup</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-neutral-900" /> Secure cloud storage</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-neutral-900" /> Built for speed</span>
          </div>

          {/* Product Preview Mockup */}
          <div className="mt-16 w-full max-w-5xl rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-neutral-200/20 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <span className="ml-2 font-mono text-[11px] text-neutral-500">avtars.app/dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-white border border-neutral-200 text-[10px] text-neutral-700 font-mono shadow-xs">Link Vault & Photos</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Mockup Sidebar */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Categories</div>
                <div className="space-y-1">
                  <div className="px-3 py-2 rounded bg-neutral-100 text-xs text-neutral-900 font-semibold flex items-center justify-between">
                    <span>Wallpapers</span>
                    <span className="text-[10px] text-neutral-500 font-mono">12</span>
                  </div>
                  <div className="px-3 py-2 rounded hover:bg-neutral-50 text-xs text-neutral-600 flex items-center justify-between">
                    <span>Design Assets</span>
                    <span className="text-[10px] text-neutral-400 font-mono">8</span>
                  </div>
                  <div className="px-3 py-2 rounded hover:bg-neutral-50 text-xs text-neutral-600 flex items-center justify-between">
                    <span>Inspiration</span>
                    <span className="text-[10px] text-neutral-400 font-mono">24</span>
                  </div>
                </div>
              </div>

              {/* Mockup Main Feed */}
              <div className="md:col-span-2 space-y-3">
                <div className="bg-white border border-neutral-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <LinkIcon className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="truncate max-w-[200px] sm:max-w-[300px]">https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe</span>
                  </div>
                  <span className="px-2.5 py-1 bg-neutral-900 text-white font-semibold text-[10px] rounded">Copy Link</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white h-32 relative shadow-xs">
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80" alt="Preview 1" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs text-[10px] text-neutral-800 font-medium border border-neutral-200">Wallpapers</div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white h-32 relative shadow-xs">
                    <img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80" alt="Preview 2" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs text-[10px] text-neutral-800 font-medium border border-neutral-200">Inspiration</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust / Value Strip */}
        <section className="border-y border-neutral-200 bg-neutral-50/70 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-center text-xs font-mono uppercase tracking-widest text-neutral-500 mb-8">
              Built for people who work with images every day.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">Store</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Keep external image links and uploaded media together in your private vault.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 mb-3">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">Organize</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Separate categories for links and photos ensure clean, clutter-free management.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 mb-3">
                  <Copy className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">Access</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Copy image URLs instantly from anywhere with one click and instant feedback.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 mb-3">
                  <FileJson className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">Export</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Download your image data and category archives as clean, human-readable JSON.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto space-y-20">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
              Everything you need.<br />
              <span className="text-neutral-500">Nothing you don't.</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              Engineered with precision for absolute speed and ease of use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 01 */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 flex flex-col justify-between space-y-8 shadow-xs">
              <div className="space-y-3">
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Feature 01 — Link Vault</span>
                <h3 className="text-xl font-bold text-neutral-900">Your links, organized.</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Save external image URLs, preview them instantly in circular thumbnails, categorize them effortlessly, and copy them whenever needed.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-neutral-500 border-b border-neutral-100 pb-2">
                  <span className="font-mono text-[10px] uppercase text-neutral-500">Wallpapers</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-neutral-50 p-2.5 rounded border border-neutral-200">
                  <span className="text-xs text-neutral-700 truncate">https://cdn.example.com/asset-01.jpg</span>
                  <span className="px-2.5 py-1 bg-neutral-900 text-white font-semibold text-[10px] rounded shrink-0">Copy</span>
                </div>
              </div>
            </div>

            {/* Feature 02 */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 flex flex-col justify-between space-y-8 shadow-xs">
              <div className="space-y-3">
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Feature 02 — Photos Gallery</span>
                <h3 className="text-xl font-bold text-neutral-900">A cleaner home for your images.</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Upload images directly to Cloudinary or add existing image URLs and manage them inside a beautiful masonry gallery with hover actions.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 grid grid-cols-2 gap-3 shadow-xs">
                <div className="h-28 rounded bg-neutral-100 border border-neutral-200 overflow-hidden relative group">
                  <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80" alt="Shoe" className="w-full h-full object-cover" />
                </div>
                <div className="h-28 rounded bg-neutral-100 border border-neutral-200 overflow-hidden relative group">
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80" alt="Headphones" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Feature 03 */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 flex flex-col justify-between space-y-8 shadow-xs">
              <div className="space-y-3">
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Feature 03 — Categories</span>
                <h3 className="text-xl font-bold text-neutral-900">Two vaults. Zero clutter.</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Link Vault categories and Photos Gallery categories are completely independent. Keep your link classifications separate from your photo albums.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 grid grid-cols-2 gap-4 shadow-xs">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Link Vault Cats</span>
                  <div className="space-y-1">
                    <div className="text-xs bg-neutral-50 px-2.5 py-1.5 rounded border border-neutral-200 text-neutral-700">Wallpapers</div>
                    <div className="text-xs bg-neutral-50 px-2.5 py-1.5 rounded border border-neutral-200 text-neutral-700">Projects</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Photos Gallery Cats</span>
                  <div className="space-y-1">
                    <div className="text-xs bg-neutral-50 px-2.5 py-1.5 rounded border border-neutral-200 text-neutral-700">Profile</div>
                    <div className="text-xs bg-neutral-50 px-2.5 py-1.5 rounded border border-neutral-200 text-neutral-700">Travel</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 04 */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 flex flex-col justify-between space-y-8 shadow-xs">
              <div className="space-y-3">
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Feature 04 — JSON Export</span>
                <h3 className="text-xl font-bold text-neutral-900">Your data stays yours.</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Export all your media or filter by category and download clean, human-readable JSON files instantly for seamless backups and portability.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center justify-between shadow-xs">
                <div className="font-mono text-xs text-neutral-600">
                  <span className="text-neutral-900 font-medium">avtars_links_all.json</span>
                  <div className="text-[10px] text-neutral-400">Ready for instant download</div>
                </div>
                <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="bg-neutral-50 border-y border-neutral-200 py-24 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-[11px] font-mono uppercase text-neutral-700 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
              <span>PRIVATE BY DESIGN</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900">
              Secure authentication.<br />Complete user isolation.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Your vault is tied to your account and designed to keep your personal media organized and accessible only to you. Backed by secure MongoDB persistence and Cloudinary media storage.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3 text-xs text-neutral-700 font-mono">
              <span className="px-3.5 py-2 bg-white border border-neutral-200 rounded-lg shadow-xs">Password Management</span>
              <span className="px-3.5 py-2 bg-white border border-neutral-200 rounded-lg shadow-xs">MongoDB Atlas</span>
              <span className="px-3.5 py-2 bg-white border border-neutral-200 rounded-lg shadow-xs">Cloudinary Storage</span>
              <span className="px-3.5 py-2 bg-white border border-neutral-200 rounded-lg shadow-xs">User-Specific Isolation</span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">How it works</h2>
            <p className="text-xs sm:text-sm text-neutral-600">Three simple steps to take control of your image assets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 space-y-4 shadow-xs">
              <div className="text-2xl font-mono font-bold text-neutral-400">01</div>
              <h3 className="text-lg font-semibold text-neutral-900">Create your vault</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">Create a private account in seconds and enter your personal workspace.</p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 space-y-4 shadow-xs">
              <div className="text-2xl font-mono font-bold text-neutral-400">02</div>
              <h3 className="text-lg font-semibold text-neutral-900">Add your images</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">Upload photo files directly or save external image URLs to your vault.</p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 space-y-4 shadow-xs">
              <div className="text-2xl font-mono font-bold text-neutral-400">03</div>
              <h3 className="text-lg font-semibold text-neutral-900">Organize & access</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">Categorize, copy, filter, and export your media whenever you need it.</p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="bg-neutral-50 border-y border-neutral-200 py-24 px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">Audience</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">Made for the way you work.</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3 shadow-xs">
                <Code className="w-5 h-5 text-neutral-900 mb-2" />
                <h3 className="text-base font-semibold text-neutral-900">Developers</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Keep image assets, CDN URLs, and project references organized and instantly accessible.</p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3 shadow-xs">
                <Palette className="w-5 h-5 text-neutral-900 mb-2" />
                <h3 className="text-base font-semibold text-neutral-900">Designers</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Save design inspiration, UI references, and frequently used image links in one central vault.</p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3 shadow-xs">
                <Zap className="w-5 h-5 text-neutral-900 mb-2" />
                <h3 className="text-base font-semibold text-neutral-900">Content Creators</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Keep media assets, thumbnails, and portfolio shots organized and ready to copy.</p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3 shadow-xs">
                <GraduationCap className="w-5 h-5 text-neutral-900 mb-2" />
                <h3 className="text-base font-semibold text-neutral-900">Students</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Store project images, screenshots, certificates, and useful study references securely.</p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3 sm:col-span-2 lg:col-span-2 shadow-xs">
                <Users className="w-5 h-5 text-neutral-900 mb-2" />
                <h3 className="text-base font-semibold text-neutral-900">Teams</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">Maintain organized visual asset references for ongoing collaborative work with private isolated user spaces.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 max-w-5xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900">
            Your images deserve<br />a better home.
          </h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto">
            Build your personal image vault with Avtars today. Simple. Organized. Yours.
          </p>
          <div>
            <button
              onClick={() => { setAuthMode('register'); setAuthModalOpen(true); }}
              className="px-8 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-all text-xs font-semibold rounded-full inline-flex items-center gap-2 group cursor-pointer shadow-lg"
            >
              <span>Create Your Vault</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-200 py-12 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Avtars Logo" className="w-6 h-6 object-contain rounded" />
            <div>
              <span className="font-semibold text-neutral-900">Avtars</span> — Personal Image Link & Photo Vault
            </div>
          </div>

          <div className="flex items-center gap-6 text-neutral-600 font-medium">
            <a href="#features" className="hover:text-neutral-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-neutral-900 transition-colors">How it works</a>
            <a href="#security" className="hover:text-neutral-900 transition-colors">Security</a>
            <button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }} className="hover:text-neutral-900 transition-colors">Sign In</button>
          </div>

          <div className="text-right space-y-1">
            <div>© 2026 Avtars. All rights reserved.</div>
            <div>Built by <a href="https://avdheshh-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-neutral-900 font-semibold underline hover:text-indigo-600">Avdhesh Kumar</a></div>
          </div>
        </footer>

        {/* Auth Modal */}
        {authModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 w-full max-w-md space-y-6 relative shadow-2xl">
              <button
                onClick={() => setAuthModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Avtars" className="w-8 h-8 rounded object-contain" />
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Welcome to Avtars</h3>
                  <p className="text-xs text-neutral-500">Your private image vault</p>
                </div>
              </div>

              <div className="flex border-b border-neutral-200">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 ${authMode === 'login' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 ${authMode === 'register' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400'}`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-neutral-700">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={nameInput || ''}
                        onChange={(e) => setNameInput(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-700">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={usernameInput || ''}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                      placeholder="Username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-700">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={passwordInput || ''}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                      placeholder="Password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loadingAuth ? 'Processing...' : authMode === 'register' ? 'Create Account & Access Vault' : 'Sign In to Vault'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Authenticated Dashboard View (unchanged private vault functionality)
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      {/* Top Bar with official logo */}
      <header className="border-b border-neutral-200 bg-white px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Avtars Logo" 
              className="w-7 h-7 object-contain rounded"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <h1 className="text-sm font-semibold tracking-tight text-neutral-900">
              Avtars
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 border-l border-neutral-200 pl-6">
            <button
              onClick={() => setActiveTab('links')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${activeTab === 'links' ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Link Vault</span>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${activeTab === 'photos' ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Photos Gallery</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 hidden sm:inline font-medium">
            {user?.name || user?.username}
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded text-xs"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-700 hover:text-neutral-900 border border-neutral-200 rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {activeTab === 'links' ? (
          <>
            {/* Add Image Link Section */}
            <div className="bg-white border border-neutral-200 rounded p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Add Image Link</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Paste an image link and select a category for your private vault.</p>
              </div>

              <form onSubmit={handleAddLink} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={imageUrlInput || ''}
                      onChange={(e) => {
                        setImageUrlInput(e.target.value);
                        setPreviewError(false);
                      }}
                      placeholder="https://example.com/image.jpg"
                      required
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  {/* Category Field & Add Category Option */}
                  <div className="w-full sm:w-48 flex gap-1.5">
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setTargetCategorySetter('link');
                          setShowAddCategoryModal(true);
                        } else {
                          setSelectedCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    >
                      {linkCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__add_new__" className="font-semibold text-indigo-600">
                        + Add category...
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !imageUrlInput.trim()}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded text-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {submitting ? 'Adding...' : 'Add Link'}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-neutral-100 border border-neutral-200 rounded text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Live Image Preview */}
                {imageUrlInput.trim() && (
                  <div className="pt-3 border-t border-neutral-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-300 bg-neutral-100 shrink-0 flex items-center justify-center">
                      {!previewError ? (
                        <img
                          src={imageUrlInput}
                          alt="Preview"
                          onError={() => setPreviewError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <div className="text-xs text-neutral-600 truncate">
                      <span className="font-medium text-neutral-900">Preview:</span> {imageUrlInput}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Filter Capsules & JSON Download Icon Button */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveFilter('All')}
                  className={`px-3 py-1.5 text-xs font-medium rounded border ${
                    activeFilter === 'All'
                      ? 'bg-neutral-100 text-neutral-900 font-semibold border-neutral-300'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  All ({links.length})
                </button>
                {linkCategories.map((cat) => {
                  const count = links.filter((l) => l.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded border ${
                        activeFilter === cat
                          ? 'bg-neutral-100 text-neutral-900 font-semibold border-neutral-300'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => downloadJson(filteredLinks, activeFilter, 'links')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-900 bg-white border border-neutral-300 rounded hover:bg-neutral-50 shrink-0 cursor-pointer"
                title={`Download ${activeFilter} links as JSON`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Saved Links Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Your Saved Links ({filteredLinks.length})
              </h3>

              {loadingData ? (
                /* Skeleton Loading State for Links */
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-neutral-200 rounded p-3.5 flex items-center justify-between gap-4 animate-pulse">
                      <div className="space-y-2 flex-1">
                        <div className="w-16 h-3 bg-neutral-200 rounded" />
                        <div className="w-48 h-4 bg-neutral-200 rounded" />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-neutral-200 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : filteredLinks.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded p-8 text-center text-xs text-neutral-500">
                  {links.length === 0 
                    ? "Your vault is empty. Paste an image link above to save your first link!"
                    : "No links found in this category."}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 py-2">
                  {filteredLinks.map((link) => (
                    <div
                      key={link.id}
                      onClick={() => copyToClipboard(link.imageUrl, link.id)}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                      title="Click to copy link"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-neutral-100 relative transition-all group-hover:scale-105 flex items-center justify-center">
                        <img
                          src={link.imageUrl}
                          alt={link.category}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                          <Copy className="w-4 h-4 mb-0.5" />
                          <span className="text-[10px] font-semibold">
                            {copiedId === link.id ? 'Copied!' : 'Copy Link'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Photos Gallery Page */}
            <div className="bg-white border border-neutral-200 rounded p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Upload / Save Photo</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Upload an image file directly (via Cloudinary) or paste a link.</p>
                </div>
                <div className="flex bg-neutral-100 p-0.5 rounded border border-neutral-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('file')}
                    className={`px-3 py-1 rounded font-medium ${photoInputMode === 'file' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'}`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('url')}
                    className={`px-3 py-1 rounded font-medium ${photoInputMode === 'url' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'}`}
                  >
                    Paste Link
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddPhoto} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    {photoInputMode === 'file' ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFileInput(e.target.files?.[0] || null)}
                        required
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded text-xs text-neutral-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800"
                      />
                    ) : (
                      <input
                        type="url"
                        value={photoUrlInput || ''}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        required
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                      />
                    )}
                  </div>

                  {/* Category Field */}
                  <div className="w-full sm:w-48 flex gap-1.5">
                    <select
                      value={photoCategory || ''}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setTargetCategorySetter('photo');
                          setShowAddCategoryModal(true);
                        } else {
                          setPhotoCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    >
                      {photoCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__add_new__" className="font-semibold text-indigo-600">
                        + Add category...
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPhoto || (photoInputMode === 'url' ? !photoUrlInput.trim() : !photoFileInput)}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded text-xs cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{submittingPhoto ? 'Uploading to Cloudinary...' : 'Save Photo'}</span>
                  </button>
                </div>

                {photoErrorMsg && (
                  <div className="p-2.5 bg-neutral-100 border border-neutral-200 rounded text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{photoErrorMsg}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Filter Capsules & Export JSON */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setPhotoFilter('All')}
                  className={`px-3 py-1.5 text-xs font-medium rounded border ${
                    photoFilter === 'All'
                      ? 'bg-neutral-100 text-neutral-900 font-semibold border-neutral-300'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  All ({photos.length})
                </button>
                {photoCategories.map((cat) => {
                  const count = photos.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setPhotoFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded border ${
                        photoFilter === cat
                          ? 'bg-neutral-100 text-neutral-900 font-semibold border-neutral-300'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => downloadJson(filteredPhotos, photoFilter, 'photos')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-900 bg-white border border-neutral-300 rounded hover:bg-neutral-50 shrink-0 cursor-pointer"
                title={`Download ${photoFilter} photos as JSON`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Masonry Layout Photo Gallery with Skeleton Loading */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Photo Gallery ({filteredPhotos.length}) — Click any image to copy its link
              </h3>

              {loadingData ? (
                /* Skeleton Loading State for Photos Gallery */
                <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="break-inside-avoid bg-neutral-100 border border-neutral-200 rounded h-64 animate-pulse" />
                  ))}
                </div>
              ) : filteredPhotos.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded p-8 text-center text-xs text-neutral-500">
                  {photos.length === 0
                    ? "Your photo gallery is empty. Upload an image above to get started!"
                    : "No photos found in this category."}
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => copyToClipboard(photo.imageUrl, `photo_${photo.id}`)}
                      className="break-inside-avoid overflow-hidden rounded group cursor-pointer relative"
                      title="Click to copy image link"
                    >
                      <div className="relative w-full bg-neutral-100">
                        <img
                          src={photo.imageUrl}
                          alt="Gallery item"
                          loading="lazy"
                          className="w-full h-auto object-cover block"
                        />
                        {/* Overlay on hover or click copied feedback */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="px-3 py-1.5 bg-white text-neutral-900 text-xs font-medium rounded">
                            {copiedId === `photo_${photo.id}` ? 'Link Copied!' : 'Copy Link'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer with portfolio link */}
      <footer className="border-t border-neutral-200 py-3 text-center text-xs text-neutral-500 mt-auto">
        All rights reserved © <a href="https://avdheshh-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-neutral-900 font-semibold underline hover:text-indigo-600">Avdhesh Kumar</a>
      </footer>

      {/* Add Category Popup Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-neutral-900" />
                Add New {targetCategorySetter === 'link' ? 'Link' : 'Photo'} Category
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-neutral-400 hover:text-neutral-900 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-3">
              {categoryError && (
                <div className="p-2 bg-neutral-100 rounded text-xs text-red-600">
                  {categoryError}
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={newCategoryName || ''}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded"
                >
                  Add & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-neutral-900" />
                Change Password
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-neutral-400 hover:text-neutral-900 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              {settingsMsg && (
                <div className={`p-2 rounded text-xs ${settingsMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {settingsMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword || ''}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword || ''}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
