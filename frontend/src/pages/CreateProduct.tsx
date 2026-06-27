import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productService, Category, ProductImage } from '../services/product.service';
import { uploadService } from '../services/upload.service';
import { Package, Upload, Image, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function CreateProduct() {
  const { user, isGestor } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageLibrary, setImageLibrary] = useState<ProductImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<ProductImage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '',
    minStock: '',
    imageUrl: '',
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isGestor || !user?.marketId) {
      navigate('/manager');
      return;
    }
    loadInitialData();
  }, [isGestor, user?.marketId, navigate]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = imageLibrary.filter(img =>
        img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        img.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredImages(filtered);
    } else {
      setFilteredImages(imageLibrary);
    }
  }, [searchTerm, imageLibrary]);

  const loadInitialData = async () => {
    try {
      const [categoriesData, imagesData] = await Promise.all([
        productService.getCategories(),
        productService.getProductImagesLibrary(),
      ]);
      setCategories(categoriesData);
      setImageLibrary(imagesData);
      setFilteredImages(imagesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar categorias e imagens');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleImageSelect = (image: ProductImage) => {
    setFormData(prev => ({ ...prev, imageUrl: image.url }));
    setImagePreview(image.url);
    setSelectedImageFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB');
        return;
      }
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      // Upload via backend (proxy) - sem chamar Supabase diretamente
      if (selectedImageFile) {
        setUploadingImage(true);
        try {
          finalImageUrl = await uploadService.uploadProductImage(selectedImageFile);
        } catch (uploadError: any) {
          setError(`Erro ao fazer upload da imagem: ${uploadError.message}`);
          setLoading(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      if (!finalImageUrl) {
        setError('Selecione uma imagem da galeria ou faça upload de uma imagem');
        setLoading(false);
        return;
      }

      await productService.createProduct({
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        imageUrl: finalImageUrl,
        marketId: user?.marketId!,
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 0,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/manager');
      }, 2000);
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao criar produto';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!isGestor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Acesso negado. Apenas gestores de mercado podem acessar esta página.
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-8">
          <div className="text-center">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto Criado com Sucesso!</h2>
            <p className="text-gray-600 mb-4">Redirecionando para o painel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/manager')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cadastrar Novo Produto</h1>
              <p className="text-gray-600 mt-1">Preencha os dados do produto abaixo</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal - Dados do Produto */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dados Básicos */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Package size={20} />
                  Dados do Produto
                </h2>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Coca-Cola 2L"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descrição detalhada do produto..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preço (R$) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria *
                      </label>
                      <select
                        name="categoryId"
                        required
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estoque Inicial
                      </label>
                      <input
                        type="number"
                        name="stock"
                        min="0"
                        value={formData.stock}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estoque Mínimo
                      </label>
                      <input
                        type="number"
                        name="minStock"
                        min="0"
                        value={formData.minStock}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Galeria de Imagens */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Image size={20} />
                  Galeria de Imagens
                </h2>

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por nome, categoria ou tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                  {filteredImages.map(image => (
                    <div
                      key={image.id}
                      onClick={() => handleImageSelect(image)}
                      className={`cursor-pointer rounded-lg border-2 transition ${
                        formData.imageUrl === image.url
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                      <div className="p-2 bg-gray-50 rounded-b-lg">
                        <p className="text-sm font-medium text-gray-900 truncate">{image.name}</p>
                        {image.category && (
                          <p className="text-xs text-gray-500">{image.category}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredImages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma imagem encontrada
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Lateral - Upload e Preview */}
            <div className="space-y-6">
              {/* Upload Personalizado */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload size={18} />
                  Upload Personalizado
                </h3>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-600 mb-1">
                      Clique para selecionar uma imagem
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG ou WEBP (máx. 5MB)
                    </p>
                  </label>
                </div>

                {selectedImageFile && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Arquivo selecionado: <span className="font-medium">{selectedImageFile.name}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImageFile(null);
                        setImagePreview(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remover arquivo
                    </button>
                  </div>
                )}
              </div>

              {/* Preview da Imagem */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>

                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-lg shadow-sm"
                    />
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ✓ Imagem selecionada
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Image size={48} className="mx-auto mb-2" />
                    <p className="text-sm">Nenhuma imagem selecionada</p>
                  </div>
                )}
              </div>

              {/* Resumo do Formulário */}
              {(formData.name || formData.price || formData.categoryId) && (
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Resumo</h3>
                  <div className="space-y-2 text-sm">
                    {formData.name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Produto:</span>
                        <span className="font-medium text-gray-900">{formData.name}</span>
                      </div>
                    )}
                    {formData.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preço:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(parseFloat(formData.price))}
                        </span>
                      </div>
                    )}
                    {formData.categoryId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Categoria:</span>
                        <span className="font-medium text-gray-900">
                          {categories.find(c => c.id === formData.categoryId)?.name}
                        </span>
                      </div>
                    )}
                    {formData.stock && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estoque:</span>
                        <span className="font-medium text-gray-900">{formData.stock} unidades</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                >
                  {loading ? 'Criando...' : uploadingImage ? 'Enviando imagem...' : 'Criar Produto'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/manager')}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}