import React, { useState, useEffect } from 'react';
import { Package, Plus, List, ArrowLeft, Save, Search, RefreshCw, LogOut, LogIn } from 'lucide-react';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' ou 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [formData, setFormData] = useState({
    tipoItem: '',
    material: '',
    numeroPatrimonio: '',
    solicitadoPor: '',
    retiradoPor: '',
    quantidade: '',
    movimentacao: ''
  });

  // Função para fazer requisições autenticadas ao Supabase
  const supabaseFetch = async (endpoint, options = {}) => {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const token = user?.access_token || SUPABASE_ANON_KEY;
    
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erro na requisição');
    }

    return response.json();
  };

  // Função de autenticação
  const supabaseAuth = async (endpoint, body) => {
    const url = `${SUPABASE_URL}/auth/v1/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error_description || data.msg || 'Erro na autenticação');
    }
    
    return data;
  };

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkSession = () => {
      const session = localStorage.getItem('supabase_session');
      if (session) {
        try {
          const userData = JSON.parse(session);
          setUser(userData);
        } catch (e) {
          localStorage.removeItem('supabase_session');
        }
      }
      setAuthLoading(false);
    };
    
    checkSession();
  }, []);

  // Carregar itens quando usuário estiver logado
  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const data = await supabaseAuth('token?grant_type=password', {
        email,
        password
      });

      const userData = {
        access_token: data.access_token,
        email: data.user.email,
        id: data.user.id
      };

      localStorage.setItem('supabase_session', JSON.stringify(userData));
      setUser(userData);
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cadastro
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      await supabaseAuth('signup', {
        email,
        password
      });

      setAuthError('');
      alert('✅ Cadastro realizado! Faça login agora.');
      setAuthMode('login');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('supabase_session');
    setUser(null);
    setItems([]);
    setCurrentScreen('home');
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await supabaseFetch('itens_estoque?select=*&order=created_at.desc');
      setItems(data || []);
    } catch (err) {
      setError('Erro ao carregar itens: ' + err.message);
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipoItem: '',
      material: '',
      numeroPatrimonio: '',
      solicitadoPor: '',
      retiradoPor: '',
      quantidade: '',
      movimentacao: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'tipoItem' && (value === 'Insumo Usado' || value === 'Insumo Novo')) {
      setFormData(prev => ({
        ...prev,
        numeroPatrimonio: 'N/A'
      }));
    } else if (field === 'tipoItem' && value === 'Patrimônio') {
      setFormData(prev => ({
        ...prev,
        numeroPatrimonio: ''
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.tipoItem || !formData.material || !formData.solicitadoPor || 
        !formData.retiradoPor || !formData.quantidade || !formData.movimentacao) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    try {
      setLoading(true);
      
      const newItem = {
        tipo_item: formData.tipoItem,
        material: formData.material,
        numero_patrimonio: formData.numeroPatrimonio,
        solicitado_por: formData.solicitadoPor,
        retirado_por: formData.retiradoPor,
        quantidade: parseInt(formData.quantidade),
        movimentacao: formData.movimentacao
      };

      await supabaseFetch('itens_estoque', {
        method: 'POST',
        body: JSON.stringify(newItem)
      });

      alert('✅ Item cadastrado com sucesso!');
      resetForm();
      setCurrentScreen('home');
      loadItems();
      
    } catch (err) {
      alert('❌ Erro ao salvar: ' + err.message);
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    (item.material?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.numero_patrimonio?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.solicitado_por?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const isConfigured = SUPABASE_URL !== 'SUA_URL_AQUI' && SUPABASE_ANON_KEY !== 'SUA_CHAVE_AQUI';

  // Tela de configuração
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="max-w-lg bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-4">
            <Package className="w-16 h-16 mx-auto mb-3 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">⚠️ Configuração Necessária</h2>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-sm text-gray-700">
              Configure suas credenciais do Supabase no arquivo src/App.js
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading inicial
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Tela de Login/Cadastro
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Package className="w-16 h-16 mx-auto mb-3 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
            <p className="text-gray-600 text-sm mt-1">Gestão Interna</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                authMode === 'signup'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {authMode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-3 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {authMode === 'login' ? 'Entrando...' : 'Cadastrando...'}
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {authMode === 'login' ? 'Entrar' : 'Criar Conta'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // HOME SCREEN (usuário logado)
  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <Package className="w-16 h-16 mx-auto mb-3 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
              <p className="text-gray-600 text-sm mt-1">Gestão Interna</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {user.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg p-2 flex items-center justify-center gap-2 text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => setCurrentScreen('cadastro')}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-4 flex items-center justify-between shadow-lg transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Cadastrar Novo Item</div>
                  <div className="text-sm text-indigo-100">Adicionar ao estoque</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                loadItems();
                setCurrentScreen('visualizar');
              }}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 rounded-lg p-4 flex items-center justify-between shadow-lg transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <List className="w-6 h-6 text-indigo-600" />
                <div className="text-left">
                  <div className="font-semibold">Visualizar Estoque</div>
                  <div className="text-sm text-gray-600">
                    {loading ? 'Carregando...' : `${items.length} itens cadastrados`}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CADASTRO SCREEN
  if (currentScreen === 'cadastro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex items-center gap-3">
            <button 
              onClick={() => setCurrentScreen('home')} 
              className="text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Cadastrar Item</h2>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo do Item *
              </label>
              <select
                value={formData.tipoItem}
                onChange={(e) => handleInputChange('tipoItem', e.target.value)}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                <option value="Insumo Usado">Insumo Usado</option>
                <option value="Insumo Novo">Insumo Novo</option>
                <option value="Patrimônio">Patrimônio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Material *
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                placeholder="Ex: Mouse Logitech M185"
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de Patrimônio
              </label>
              <input
                type="text"
                value={formData.numeroPatrimonio}
                onChange={(e) => handleInputChange('numeroPatrimonio', e.target.value)}
                placeholder="N/A ou número do patrimônio"
                disabled={loading || formData.tipoItem === 'Insumo Usado' || formData.tipoItem === 'Insumo Novo'}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Solicitado Por *
              </label>
              <input
                type="text"
                value={formData.solicitadoPor}
                onChange={(e) => handleInputChange('solicitadoPor', e.target.value)}
                placeholder="Nome do solicitante"
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Retirado Por *
              </label>
              <input
                type="text"
                value={formData.retiradoPor}
                onChange={(e) => handleInputChange('retiradoPor', e.target.value)}
                placeholder="Nome de quem retirou"
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantidade *
              </label>
              <select
                value={formData.quantidade}
                onChange={(e) => handleInputChange('quantidade', e.target.value)}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                {[1,2,3,4,5,10,15,20,25,30,40,50,75,100].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Movimentação do Item *
              </label>
              <select
                value={formData.movimentacao}
                onChange={(e) => handleInputChange('movimentacao', e.target.value)}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                <option value="Entrada">Entrada</option>
                <option value="Saída">Saída</option>
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg p-4 flex items-center justify-center gap-2 font-semibold shadow-lg transition mt-6 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Item
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VISUALIZAR SCREEN
  if (currentScreen === 'visualizar') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentScreen('home')} 
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-gray-800">Itens em Estoque</h2>
            </div>
            <button
              onClick={loadItems}
              disabled={loading}
              className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por material, patrimônio ou solicitante..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading && items.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 text-indigo-400 animate-spin" />
              <p>Carregando itens...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum item encontrado</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{item.material}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.movimentacao === 'Entrada' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.movimentacao}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-semibold">Tipo:</span>
                        <p className="text-gray-800">{item.tipo_item}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Patrimônio:</span>
                        <p className="text-gray-800">{item.numero_patrimonio}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Solicitado:</span>
                        <p className="text-gray-800">{item.solicitado_por}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Retirado:</span>
                        <p className="text-gray-800">{item.retirado_por}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Quantidade:</span>
                        <p className="text-gray-800">{item.quantidade} unidade(s)</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default App;