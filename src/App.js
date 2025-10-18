import React, { useState, useEffect } from 'react';
import { Package, Plus, List, ArrowLeft, Save, Search, RefreshCw } from 'lucide-react';

// ⚠️ IMPORTANTE: Substitua pelas suas credenciais do Supabase
const SUPABASE_URL = 'https://qfdidmicyoqvemvalpal.supabase.co'; // Ex: https://abc123.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGlkbWljeW9xdmVtdmFscGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NjU1NTYsImV4cCI6MjA3NjM0MTU1Nn0._FMyikNhxm7KDGUe7i4JBnx7dSQ9jaiYIp2bJuZdtBQ'; // A chave anon/public

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    tipoItem: '',
    material: '',
    numeroPatrimonio: '',
    solicitadoPor: '',
    retiradoPor: '',
    quantidade: '',
    movimentacao: ''
  });

  const supabaseFetch = async (endpoint, options = {}) => {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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

  useEffect(() => {
    if (SUPABASE_URL !== 'SUA_URL_AQUI' && SUPABASE_ANON_KEY !== 'SUA_CHAVE_AQUI') {
      loadItems();
    }
  }, []);

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

  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
            <Package className="w-16 h-16 mx-auto mb-3 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
            <p className="text-gray-600 text-sm mt-1">Gestão Interna</p>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Conectado ao Supabase
            </div>
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