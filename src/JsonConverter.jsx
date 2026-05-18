import React, { useState } from 'react';
import { FileJson, ArrowRight, Copy, Check, ChevronDown, ChevronUp, Plus, Trash2, FileEdit, Upload, HelpCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';

// localStorage helpers replacing window.storage
const storage = {
  get: (key) => {
    const value = localStorage.getItem(key);
    return value ? { value } : null;
  },
  set: (key, value) => {
    localStorage.setItem(key, value);
  },
};

export default function JsonConverter() {
  const [activeTab, setActiveTab] = useState('creator');
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showExcelHelp, setShowExcelHelp] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [savedSuppliers, setSavedSuppliers] = useState({});
  const [savedCarriers, setSavedCarriers] = useState({});
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingCarrier, setEditingCarrier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({
    cnpjCpf: '', name: '', personType: 'J', zipCode: '', address: '',
    number: '', neighborhood: '', complement: '', city: '', state: ''
  });
  const [newCarrier, setNewCarrier] = useState({
    cnpjCpf: '', name: '', personType: 'J', zipCode: '', address: '',
    number: '', neighborhood: '', complement: '', city: '', state: '', description: ''
  });

  React.useEffect(() => {
    const loadSuppliers = () => {
      try {
        const result = storage.get('suppliers-data');
        if (result && result.value) setSavedSuppliers(JSON.parse(result.value));
      } catch (e) {}
    };
    const loadCarriers = () => {
      try {
        const result = storage.get('carriers-data');
        if (result && result.value) setSavedCarriers(JSON.parse(result.value));
      } catch (e) {}
    };
    loadSuppliers();
    loadCarriers();
  }, []);

  const notify = (msg) => {
    setSuccessMessage(msg);
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);
  };

  const saveCarrier = (cnpjCpf, data) => {
    const updated = { ...savedCarriers, [cnpjCpf]: { ...data, lastUpdated: new Date().toISOString() } };
    storage.set('carriers-data', JSON.stringify(updated));
    setSavedCarriers(updated);
    notify('💾 Transportadora salva com sucesso!');
  };

  const loadCarrierByCnpj = (cnpjCpf) => {
    if (cnpjCpf && savedCarriers[cnpjCpf]) {
      const c = savedCarriers[cnpjCpf];
      setCarrierData({
        cnpjCpf: c.cnpjCpf || '', name: c.name || '', personType: c.personType || 'J',
        neighborhood: c.neighborhood || '', address: c.address || '', number: c.number || '',
        city: c.city || '', zipCode: c.zipCode || '', state: c.state || '',
        complement: c.complement || '', description: c.description || ''
      });
      notify('✅ Dados da transportadora carregados!');
      return true;
    }
    return false;
  };

  const deleteCarrier = (cnpjCpf) => {
    if (window.confirm(`Deseja realmente excluir a transportadora ${cnpjCpf}?`)) {
      const updated = { ...savedCarriers };
      delete updated[cnpjCpf];
      storage.set('carriers-data', JSON.stringify(updated));
      setSavedCarriers(updated);
      notify('🗑️ Transportadora excluída com sucesso!');
    }
  };

  const saveCarrierFromForm = () => {
    const carrier = editingCarrier || newCarrier;
    if (!carrier.cnpjCpf || (carrier.cnpjCpf.length !== 11 && carrier.cnpjCpf.length !== 14)) {
      alert('CNPJ/CPF deve ter 11 ou 14 dígitos!'); return;
    }
    if (!carrier.name) { alert('Nome da transportadora é obrigatório!'); return; }
    const updated = { ...savedCarriers, [carrier.cnpjCpf]: { ...carrier, lastUpdated: new Date().toISOString() } };
    storage.set('carriers-data', JSON.stringify(updated));
    setSavedCarriers(updated);
    setNewCarrier({ cnpjCpf: '', name: '', personType: 'J', zipCode: '', address: '', number: '', neighborhood: '', complement: '', city: '', state: '', description: '' });
    setEditingCarrier(null);
    notify(editingCarrier ? '✅ Transportadora atualizada!' : '✅ Transportadora cadastrada!');
  };

  const startEditCarrier = (cnpjCpf) => { setEditingCarrier({ ...savedCarriers[cnpjCpf] }); setActiveTab('carriers'); };
  const cancelEditCarrier = () => {
    setEditingCarrier(null);
    setNewCarrier({ cnpjCpf: '', name: '', personType: 'J', zipCode: '', address: '', number: '', neighborhood: '', complement: '', city: '', state: '', description: '' });
  };

  const saveSupplier = (cnpjCpf, data) => {
    const updated = { ...savedSuppliers, [cnpjCpf]: { ...data, lastUpdated: new Date().toISOString() } };
    storage.set('suppliers-data', JSON.stringify(updated));
    setSavedSuppliers(updated);
    notify('💾 Fornecedor salvo com sucesso!');
  };

  const loadSupplierByCnpj = (cnpjCpf) => {
    if (cnpjCpf && savedSuppliers[cnpjCpf]) {
      const s = savedSuppliers[cnpjCpf];
      setSupplierData({
        cnpjCpf: s.cnpjCpf || '', neighborhood: s.neighborhood || '', zipCode: s.zipCode || '',
        complement: s.complement || '', name: s.name || '', address: s.address || '',
        number: s.number || '', city: s.city || '', personType: s.personType || 'J', state: s.state || ''
      });
      notify('✅ Dados do fornecedor carregados!');
      return true;
    }
    return false;
  };

  const deleteSupplier = (cnpjCpf) => {
    if (window.confirm(`Deseja realmente excluir o fornecedor ${cnpjCpf}?`)) {
      const updated = { ...savedSuppliers };
      delete updated[cnpjCpf];
      storage.set('suppliers-data', JSON.stringify(updated));
      setSavedSuppliers(updated);
      notify('🗑️ Fornecedor excluído com sucesso!');
    }
  };

  const saveSupplierFromForm = () => {
    const supplier = editingSupplier || newSupplier;
    if (!supplier.cnpjCpf || (supplier.cnpjCpf.length !== 11 && supplier.cnpjCpf.length !== 14)) {
      alert('CNPJ/CPF deve ter 11 ou 14 dígitos!'); return;
    }
    if (!supplier.name) { alert('Nome do fornecedor é obrigatório!'); return; }
    const updated = { ...savedSuppliers, [supplier.cnpjCpf]: { ...supplier, lastUpdated: new Date().toISOString() } };
    storage.set('suppliers-data', JSON.stringify(updated));
    setSavedSuppliers(updated);
    setNewSupplier({ cnpjCpf: '', name: '', personType: 'J', zipCode: '', address: '', number: '', neighborhood: '', complement: '', city: '', state: '' });
    setEditingSupplier(null);
    notify(editingSupplier ? '✅ Fornecedor atualizado!' : '✅ Fornecedor cadastrado!');
  };

  const startEditSupplier = (cnpjCpf) => { setEditingSupplier({ ...savedSuppliers[cnpjCpf] }); setActiveTab('suppliers'); };
  const cancelEdit = () => {
    setEditingSupplier(null);
    setNewSupplier({ cnpjCpf: '', name: '', personType: 'J', zipCode: '', address: '', number: '', neighborhood: '', complement: '', city: '', state: '' });
  };

  const handleSuppliersFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        let workbook;
        if (file.name.toLowerCase().endsWith('.csv')) {
          const decoder = new TextDecoder('windows-1252');
          const text = decoder.decode(data);
          workbook = XLSX.read(text, { type: 'string', raw: true });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        if (jsonData.length === 0) { alert('❌ Planilha vazia ou sem dados válidos.'); return; }

        const columns = Object.keys(jsonData[0]);
        const findColumn = (possibleNames) => {
          for (let col of columns) {
            const normalized = col.trim().toLowerCase().replace(/\s+/g, '');
            for (let name of possibleNames) {
              if (normalized === name.toLowerCase().replace(/\s+/g, '')) return col;
            }
          }
          return null;
        };

        const colCNPJ = findColumn(['EmpresaDescrição', 'Empresa Descrição', 'Empresas', 'CNPJ', 'CPF', 'EmpresaDescricao']);
        const colNome = findColumn(['Empresa', 'Nome', 'Razão Social', 'RazaoSocial']);
        const colEndereco = findColumn(['Endereço', 'Endereco', 'End']);
        const colNumero = findColumn(['Número', 'Numero', 'Nro', 'N']);
        const colBairro = findColumn(['Bairro']);
        const colCEP = findColumn(['CEP']);
        const colMunicipio = findColumn(['Município', 'Municipio', 'Cidade']);
        const colUF = findColumn(['UF', 'Estado']);
        const colTipoPessoa = findColumn(['Tipo Pessoa', 'TipoPessoa', 'Tipo']);

        if (!colCNPJ) { alert('❌ Coluna de CNPJ/CPF não encontrada!\n\nColunas detectadas:\n' + columns.join('\n')); return; }
        if (!colNome) { alert('❌ Coluna de Nome/Empresa não encontrada!\n\nColunas detectadas:\n' + columns.join('\n')); return; }

        let importCount = 0, errorCount = 0;
        const errors = [];
        const newSuppliers = { ...savedSuppliers };

        jsonData.forEach((row, index) => {
          try {
            const cnpjCpf = String(row[colCNPJ] || '').replace(/\D/g, '');
            if (!cnpjCpf || (cnpjCpf.length !== 11 && cnpjCpf.length !== 14)) {
              errors.push(`Linha ${index + 2}: CNPJ/CPF inválido ("${row[colCNPJ]}")`); errorCount++; return;
            }
            if (!row[colNome]) {
              errors.push(`Linha ${index + 2}: Nome vazio`); errorCount++; return;
            }
            newSuppliers[cnpjCpf] = {
              cnpjCpf, name: String(row[colNome] || '').toUpperCase(),
              address: String(row[colEndereco] || '').toUpperCase(),
              number: String(row[colNumero] || 'S/N'),
              neighborhood: String(row[colBairro] || '').toUpperCase(),
              zipCode: String(row[colCEP] || '').replace(/\D/g, ''),
              city: String(row[colMunicipio] || '').toUpperCase(),
              state: String(row[colUF] || '').toUpperCase(),
              personType: colTipoPessoa && row[colTipoPessoa] === 'F' ? 'F' : 'J',
              complement: 'N/A', lastUpdated: new Date().toISOString()
            };
            importCount++;
          } catch (err) { errors.push(`Linha ${index + 2}: ${err.message}`); errorCount++; }
        });

        storage.set('suppliers-data', JSON.stringify(newSuppliers));
        setSavedSuppliers(newSuppliers);
        e.target.value = '';

        if (errorCount > 0) {
          alert(`✅ ${importCount} fornecedores importados!\n⚠️ ${errorCount} linhas com erro:\n\n${errors.slice(0, 5).join('\n')}`);
          notify(`✅ ${importCount} importados | ⚠️ ${errorCount} erros`);
        } else {
          notify(`✅ ${importCount} fornecedores importados com sucesso!`);
        }
      } catch (err) {
        alert(`❌ Erro ao processar planilha:\n\n${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const [formData, setFormData] = useState({
    cnpjCpfEmpresa: '', codigoEstabelecimento: 8, tipoDocumento: 'CINV',
    serieDocumento: '1', numeroDocumento: '', descricaoNaturezaOperacao: 'SEM VALOR FISCAL',
    informacaoAdicional: '', valorTotalDocumento: 0, valorTotalProduto: 0,
    valorDesconto: 0, valorFrete: 0, valorSeguro: 0, documentType: 'inbound',
  });

  const [supplierData, setSupplierData] = useState({
    cnpjCpf: '', neighborhood: '', zipCode: '', complement: '',
    name: '', address: '', number: '', city: '', personType: 'J', state: ''
  });

  const [showSupplierFields, setShowSupplierFields] = useState(false);

  const [customerData, setCustomerData] = useState({
    cnpjCpf: '', name: '', personType: 'J', neighborhood: '', zipCode: '',
    complement: '', description: '', address: '', number: '', city: '', state: ''
  });

  const [carrierData, setCarrierData] = useState({
    cnpjCpf: '', name: '', personType: 'J', neighborhood: '', address: '',
    number: '', city: '', zipCode: '', state: '', complement: '', description: ''
  });

  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [showCarrierFields, setShowCarrierFields] = useState(false);

  const [products, setProducts] = useState([{
    codigoProduto: '', quantidadeMovimento: 0, tipoUc: 'UN', fatorTipoUc: '1',
    classeProduto: '00', valorUnitario: 1.0, tipoLogistico: '1', dadoLogistico: ''
  }]);

  const emptyProduct = { codigoProduto: '', quantidadeMovimento: 0, tipoUc: 'UN', fatorTipoUc: '1', classeProduto: '00', valorUnitario: 1.0, tipoLogistico: '1', dadoLogistico: '' };

  const convertJson = () => {
    try {
      setError('');
      const input = JSON.parse(inputJson);
      if (!input.documentos || !Array.isArray(input.documentos)) {
        throw new Error('JSON de entrada inválido: esperado propriedade "documentos"');
      }
      const documentType = formData.documentType;
      const orders = input.documentos.map(doc => {
        const now = new Date();
        const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const year = brasiliaTime.getFullYear();
        const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
        const day = String(brasiliaTime.getDate()).padStart(2, '0');
        const hours = String(brasiliaTime.getHours()).padStart(2, '0');
        const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
        const seconds = String(brasiliaTime.getSeconds()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;

        const uniqueProducts = new Set();
        (doc.detalhes || []).forEach(item => { if (item.codigoProduto) uniqueProducts.add(item.codigoProduto); });
        const volumeQuantity = uniqueProducts.size || 1;

        const baseOrder = {
          wareHouseCode: doc.codigoEstabelecimento || 0,
          expectedMovementDate: currentDate,
          orderNumber: doc.numeroDocumento || "",
          orderSeries: doc.serieDocumento || "01",
          orderType: doc.tipoDocumento || "NFE",
          nfeAccessKey: "00000000000000000000000000000000000000000000",
          issueDate: currentDate,
          additionValue: 0,
          discountValue: doc.valorDesconto || 0,
          freightValue: doc.valorFrete || 0,
          insuranceValue: doc.valorSeguro || 0,
          totalOrderValue: doc.valorTotalDocumento || 0,
          totalProductValue: doc.valorTotalProduto || 0,
          grossWeight: 0, netWeight: 0, volumeQuantity,
        };

        const commonFields = {
          nfeAuthorizationDate: null, nfeProtocol: null, transportMode: null,
          volumeTrackingCode: null, additionalInfo1: null, additionalInfo2: null,
          additionalInfo3: null, cfop: null, shelfLifeRemainingPercent: null, costCenter: null,
        };

        const mappedItems = (doc.detalhes || []).map(item => ({
          productClass: item.classeProduto || "00",
          ean: item.codigoProduto || "",
          batchCode: item.dadoLogistico || null,
          purchaseUnitFactor: parseInt(item.fatorTipoUc) || 1,
          purchaseUnitType: item.tipoUc || "UN",
          expirationDate: null,
          quantity: item.quantidadeMovimento || 0,
          additionValue: 0, discountValue: 0, serviceValue: 0,
          unitValue: parseFloat(item.valorUnitario) || 0, fiscalUnitValue: 0
        }));

        if (documentType === 'outbound') {
          const customerInfo = {
            cnpjCpf: customerData.cnpjCpf || doc.cnpjCpfCliente || "",
            name: customerData.name || "CLIENTE PADRAO",
            personType: customerData.personType || "J",
            neighborhood: customerData.neighborhood || "CENTRO",
            zipCode: customerData.zipCode || "00000-000",
            complement: customerData.complement || "N/A",
            description: customerData.description || doc.descricaoNaturezaOperacao || "",
            address: customerData.address || "RUA PADRAO",
            number: customerData.number || "S/N",
            city: customerData.city || "SAO PAULO",
            state: customerData.state || "SP"
          };
          const carrierInfo = carrierData.cnpjCpf ? {
            cnpjCpf: carrierData.cnpjCpf, name: carrierData.name || null,
            description: carrierData.description || null, personType: carrierData.personType || "J",
            neighborhood: carrierData.neighborhood || null, address: carrierData.address || null,
            number: carrierData.number || null, city: carrierData.city || null,
            zipCode: carrierData.zipCode || null, state: carrierData.state || null,
            complement: carrierData.complement || null
          } : { cnpjCpf: null, name: null, description: null, personType: null, neighborhood: null, address: null, number: null, city: null, zipCode: null, state: null, complement: null };

          return {
            ...baseOrder, ...commonFields, salesChannel: "B2B", items: mappedItems,
            project: { code: null, name: null },
            customer: customerInfo, carrier: carrierInfo,
            shippingLabel: { content: null, type: null },
            shippingAddress: { cnpjCpf: null, name: null, description: null, personType: null, neighborhood: null, address: null, number: null, city: null, zipCode: null, state: null, complement: null }
          };
        } else {
          const supplierInfo = {
            neighborhood: supplierData.neighborhood || "CENTRO",
            zipCode: supplierData.zipCode || "00000-000",
            cnpjCpf: supplierData.cnpjCpf || doc.cnpjCpfEmpresa || "",
            complement: supplierData.complement || "N/A",
            name: supplierData.name || "FORNECEDOR PADRAO",
            description: doc.descricaoNaturezaOperacao || "",
            address: supplierData.address || "RUA PADRAO",
            number: supplierData.number || "S/N",
            city: supplierData.city || "SAO PAULO",
            personType: supplierData.personType || "J",
            state: supplierData.state || "SP"
          };
          const carrierInfoInbound = carrierData.cnpjCpf ? {
            neighborhood: carrierData.neighborhood || null, zipCode: carrierData.zipCode || null,
            cnpjCpf: carrierData.cnpjCpf, complement: carrierData.complement || null,
            name: carrierData.name || null, description: carrierData.description || null,
            address: carrierData.address || null, city: carrierData.city || null,
            number: carrierData.number || null, personType: carrierData.personType || "J",
            state: carrierData.state || null
          } : null;

          return {
            ...baseOrder, ...commonFields, items: mappedItems, supplier: supplierInfo,
            ...(carrierInfoInbound && { carrier: carrierInfoInbound })
          };
        }
      });

      setOutputJson(JSON.stringify({ orders, packingList: null }, null, 2));
    } catch (err) {
      setError(`Erro ao converter: ${err.message}`);
      setOutputJson('');
    }
  };

  const generateJsonFromForm = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const json = {
      documentos: [{
        agrupador: 0, cnpjCpfEmpresa: formData.cnpjCpfEmpresa, cnpjCpfTransportadora: "",
        codigoEstabelecimento: formData.codigoEstabelecimento, codigoDepositante: formData.cnpjCpfEmpresa,
        tipoDocumento: formData.tipoDocumento.toUpperCase(), serieDocumento: formData.serieDocumento,
        codigoEmpresa: formData.cnpjCpfEmpresa, codigoTransportadora: "",
        descricaoNaturezaOperacao: formData.descricaoNaturezaOperacao.toUpperCase(),
        dataEmissao: dateStr, dataPrevisaoMovimento: dateStr,
        valorTotalDocumento: parseFloat(formData.valorTotalDocumento) || 0,
        valorTotalProduto: parseFloat(formData.valorTotalProduto) || 0,
        valorBaseIcmsSub: 0, valorDesconto: parseFloat(formData.valorDesconto) || 0,
        valorFrete: parseFloat(formData.valorFrete) || 0, valorIcmsSub: 0,
        valorSeguro: parseFloat(formData.valorSeguro) || 0, quantidadeVolume: 0,
        numeroDocumento: formData.numeroDocumento, naturezaOperacao: "0000",
        informacaoAdicional: formData.informacaoAdicional.toUpperCase(),
        detalhes: products.map(p => ({
          codigoEmpresa: formData.cnpjCpfEmpresa,
          codigoProduto: p.codigoProduto,
          quantidadeMovimento: parseInt(p.quantidadeMovimento) || 0,
          tipoUc: p.tipoUc.toUpperCase(), fatorTipoUc: p.fatorTipoUc,
          classeProduto: p.classeProduto.toUpperCase(),
          valorUnitario: parseFloat(p.valorUnitario) || 1.0,
          tipoLogistico: p.tipoLogistico, dadoLogistico: p.dadoLogistico.toUpperCase()
        }))
      }]
    };
    setInputJson(JSON.stringify(json, null, 2));
    notify('✅ JSON gerado com sucesso!');
    setActiveTab('converter');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const addProduct = () => setProducts([...products, { ...emptyProduct }]);
  const removeProduct = (index) => setProducts(products.filter((_, i) => i !== index));
  const updateProduct = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        if (jsonData.length === 0) { setUploadError('Planilha vazia ou sem dados válidos.'); setUploadedFileName(''); return; }
        const mappedProducts = jsonData.map(row => ({
          codigoProduto: String(row.codigoProduto || ''),
          quantidadeMovimento: parseInt(row.quantidadeMovimento) || 0,
          tipoUc: String(row.tipoUc || 'UN'), fatorTipoUc: String(row.fatorTipoUc || '1'),
          classeProduto: String(row.classeProduto || '00'),
          valorUnitario: parseFloat(row.valorUnitario) || 1.0,
          tipoLogistico: String(row.tipoLogistico || '1'), dadoLogistico: String(row.dadoLogistico || '')
        }));
        setProducts(mappedProducts);
        e.target.value = '';
        notify(`✅ ${mappedProducts.length} produtos importados com sucesso!`);
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
      } catch (err) { setUploadError(`Erro ao ler planilha: ${err.message}`); setUploadedFileName(''); }
    };
    reader.onerror = () => { setUploadError('Erro ao ler o arquivo.'); setUploadedFileName(''); };
    reader.readAsArrayBuffer(file);
  };

  const clearUploadedFile = () => { setUploadedFileName(''); setProducts([{ ...emptyProduct }]); };

  const copyToClipboard = (text, isInput = false) => {
    if (!text) { alert('Não há conteúdo para copiar!'); return; }
    const set = isInput ? setCopiedInput : setCopied;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => { set(true); setTimeout(() => set(false), 2000); }).catch(() => fallbackCopy(text, set));
    } else { fallbackCopy(text, set); }
  };

  const fallbackCopy = (text, set) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;left:-999999px;top:-999999px';
    document.body.appendChild(el);
    el.focus(); el.select();
    document.execCommand('copy') ? (set(true), setTimeout(() => set(false), 2000)) : alert('Não foi possível copiar. Selecione e copie manualmente.');
    document.body.removeChild(el);
  };

  const clearProducts = () => {
    if (window.confirm('Deseja realmente limpar todos os produtos?')) {
      setProducts([{ ...emptyProduct }]);
      notify('🗑️ Produtos limpos com sucesso!');
    }
  };

  const loadSampleJson = () => {
    setInputJson(JSON.stringify({
      documentos: [{
        agrupador: 0, cnpjCpfEmpresa: "59769230000243", cnpjCpfTransportadora: "",
        codigoEstabelecimento: 8, codigoDepositante: "59769230000243",
        tipoDocumento: "CINV", serieDocumento: "1", codigoEmpresa: "59769230000243",
        codigoTransportadora: "", descricaoNaturezaOperacao: "SEM VALOR FISCAL",
        dataEmissao: "2025-10-23 10:00:00", dataPrevisaoMovimento: "2025-10-23 10:00:00",
        valorTotalDocumento: 0, valorTotalProduto: 0, valorBaseIcmsSub: 0,
        valorDesconto: 0, valorFrete: 0, valorIcmsSub: 0, valorSeguro: 0,
        quantidadeVolume: 0, numeroDocumento: "2932", naturezaOperacao: "0000",
        informacaoAdicional: "SOLICITACAO DE ENTRADA VIA BITRIX, CHAMADO: 2937.",
        detalhes: [
          { codigoEmpresa: "35705066000242", codigoProduto: "7898970092551", quantidadeMovimento: 12, tipoUc: "UN", fatorTipoUc: "1", classeProduto: "00", valorUnitario: 1.0, tipoLogistico: "1", dadoLogistico: "" },
          { codigoEmpresa: "35705066000242", codigoProduto: "7898749570631", quantidadeMovimento: 24, tipoUc: "UN", fatorTipoUc: "1", classeProduto: "00", valorUnitario: 1.0, tipoLogistico: "1", dadoLogistico: "" }
        ]
      }]
    }, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-8">
      <div className="max-w-7xl mx-auto">
        {showSuccessNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <FileJson className="w-10 h-10 text-red-600" />
            Gerar JSON UNILOG
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'creator', label: 'Gerar JSON', icon: <FileEdit className="w-5 h-5" /> },
            { id: 'converter', label: 'Payload', icon: <ArrowRight className="w-5 h-5" /> },
            { id: 'suppliers', label: 'Fornecedores', icon: <FileJson className="w-5 h-5" /> },
            { id: 'carriers', label: 'Transportadoras', icon: <Trash2 className="w-5 h-5" /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold transition-colors ${activeTab === tab.id ? 'bg-white text-red-600 shadow-md' : 'bg-white/50 text-gray-600 hover:bg-white/75'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Converter Tab */}
        {activeTab === 'converter' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">API 1.0</h2>
                  <div className="flex gap-2">
                    {inputJson && (
                      <>
                        <button onClick={() => copyToClipboard(inputJson, true)} className="flex items-center gap-2 text-sm px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors">
                          {copiedInput ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copiedInput ? 'Copiado!' : 'Copiar'}
                        </button>
                        <button onClick={() => setInputJson('')} className="flex items-center gap-2 text-sm px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />Limpar
                        </button>
                      </>
                    )}
                    <button onClick={loadSampleJson} className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">Exemplo</button>
                  </div>
                </div>
                <textarea value={inputJson} onChange={(e) => setInputJson(e.target.value)}
                  placeholder='Cole aqui o JSON no formato "documentos" (API 1.0)...'
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div className="flex justify-center">
                <button onClick={convertJson} disabled={!inputJson}
                  className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-lg shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100 w-full justify-center">
                  Converter<ArrowRight className="w-6 h-6" />
                </button>
              </div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  <strong>Erro: </strong><span>{error}</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">API 2.0</h2>
                <div className="flex gap-2">
                  {outputJson && (
                    <>
                      <button onClick={() => copyToClipboard(outputJson, false)} className="flex items-center gap-2 text-sm px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copiado!' : 'Copiar'}
                      </button>
                      <button onClick={() => setOutputJson('')} className="flex items-center gap-2 text-sm px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />Limpar
                      </button>
                    </>
                  )}
                </div>
              </div>
              {outputJson && (() => {
                try {
                  const parsed = JSON.parse(outputJson);
                  const hasCustomer = parsed.orders?.[0]?.customer;
                  const hasSupplier = parsed.orders?.[0]?.supplier;
                  return (
                    <div className="mb-2 text-xs">
                      {hasCustomer ? <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium">📤 Estrutura Outbound (Saída) - Com Cliente</span>
                        : hasSupplier ? <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">📥 Estrutura Inbound (Entrada) - Com Fornecedor</span>
                        : null}
                    </div>
                  );
                } catch (e) { return null; }
              })()}
              <textarea value={outputJson} readOnly className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50" />
            </div>
          </div>
        )}

        {/* Creator Tab */}
        {activeTab === 'creator' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Preencha os dados do depositante</h2>

            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
              <label className="block text-sm font-semibold text-purple-900 mb-3">Tipo de Movimentação *</label>
              <div className="flex gap-4">
                {[['inbound', '📥 Entrada (Inbound)'], ['outbound', '📤 Saída (Outbound)']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="documentType" value={val}
                      checked={formData.documentType === val}
                      onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                      className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-900 font-medium">{label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-purple-700 mt-2">
                {formData.documentType === 'inbound' ? '💡 Entrada: Recebimento de mercadorias (requer dados do Fornecedor)' : '💡 Saída: Expedição de mercadorias (requer dados do Cliente)'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ/CPF Empresa *</label>
                <input type="text" value={formData.cnpjCpfEmpresa}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 14) setFormData({...formData, cnpjCpfEmpresa: v}); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="00000000000000" />
                <p className="text-xs text-gray-500 mt-1">CPF: 11 dígitos | CNPJ: 14 dígitos (apenas números)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código Estabelecimento</label>
                <input type="text" value={formData.codigoEstabelecimento}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 2) setFormData({...formData, codigoEstabelecimento: v}); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="8" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Documento</label>
                <select value={formData.tipoDocumento} onChange={(e) => setFormData({...formData, tipoDocumento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="CINV">CINV</option><option value="NFE">NFE</option><option value="NFS">NFS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Série Documento</label>
                <input type="text" value={formData.serieDocumento}
                  onChange={(e) => setFormData({...formData, serieDocumento: e.target.value.replace(/\D/g, '')})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número Documento *</label>
                <input type="text" value={formData.numeroDocumento}
                  onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ex: 2932" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Natureza Operação</label>
                <input type="text" value={formData.descricaoNaturezaOperacao}
                  onChange={(e) => setFormData({...formData, descricaoNaturezaOperacao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Informação Adicional</label>
                <textarea value={formData.informacaoAdicional} onChange={(e) => setFormData({...formData, informacaoAdicional: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" rows="2" />
              </div>
            </div>

            {/* Fornecedor (Inbound) */}
            {formData.documentType === 'inbound' && (
              <div className="border-t pt-6 mb-6">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">Dados do Fornecedor (API 2.0)</h3>
                      <p className="text-sm text-blue-700">Obrigatório apenas para clientes da API 2.0</p>
                    </div>
                    <button onClick={() => setShowSupplierFields(!showSupplierFields)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                      {showSupplierFields ? <><ChevronUp className="w-4 h-4" />Ocultar</> : <><ChevronDown className="w-4 h-4" />Preencher Dados</>}
                    </button>
                  </div>
                </div>
                {showSupplierFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-blue-900 mb-2">CNPJ/CPF Fornecedor *</label>
                      <div className="flex gap-2">
                        <input type="text" value={supplierData.cnpjCpf || ''}
                          onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 14) setSupplierData({...supplierData, cnpjCpf: v}); }}
                          onBlur={(e) => { const v = e.target.value; if (v.length === 11 || v.length === 14) loadSupplierByCnpj(v); }}
                          className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Digite o CNPJ/CPF" />
                        {supplierData.cnpjCpf && (supplierData.cnpjCpf.length === 11 || supplierData.cnpjCpf.length === 14) && (
                          <button onClick={() => saveSupplier(supplierData.cnpjCpf, supplierData)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2">
                            <Copy className="w-4 h-4" />Salvar
                          </button>
                        )}
                      </div>
                    </div>
                    {Object.keys(savedSuppliers).length > 0 && (
                      <div className="md:col-span-2 mb-2">
                        <label className="block text-sm font-medium text-blue-900 mb-2">Ou selecione um fornecedor salvo:</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(savedSuppliers).map(cnpj => (
                            <div key={cnpj} className="flex items-center gap-1 bg-white border border-blue-300 rounded-lg px-3 py-1">
                              <button onClick={() => { setSupplierData({...supplierData, cnpjCpf: cnpj}); loadSupplierByCnpj(cnpj); }}
                                className="text-sm text-blue-700 hover:text-blue-900 font-medium">
                                {cnpj} - {savedSuppliers[cnpj].name}
                              </button>
                              <button onClick={() => deleteSupplier(cnpj)} className="text-red-500 hover:text-red-700 ml-2"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {[
                      ['name', 'Nome do Fornecedor *', 'EI BELEZA SERVICOS LTDA', 'md:col-span-2'],
                      ['zipCode', 'CEP *', '06696-110'],
                      ['address', 'Endereço *', 'RODOVIA CORONEL NELSON TRANCHESI', 'md:col-span-2'],
                      ['number', 'Número', 'S/N'],
                      ['neighborhood', 'Bairro *', 'ITAPEVI'],
                      ['complement', 'Complemento', 'N/A'],
                      ['city', 'Cidade *', 'SAO PAULO'],
                    ].map(([field, label, placeholder, colSpan]) => (
                      <div key={field} className={colSpan || ''}>
                        <label className="block text-sm font-medium text-blue-900 mb-2">{label}</label>
                        <input type="text" value={supplierData[field] || ''}
                          onChange={(e) => setSupplierData({...supplierData, [field]: e.target.value})}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder={placeholder} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">Tipo Pessoa</label>
                      <select value={supplierData.personType || 'J'} onChange={(e) => setSupplierData({...supplierData, personType: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="J">Jurídica</option><option value="F">Física</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">Estado *</label>
                      <input type="text" value={supplierData.state || ''}
                        onChange={(e) => { const v = e.target.value.toUpperCase(); if (v.length <= 2) setSupplierData({...supplierData, state: v}); }}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="SP" maxLength="2" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cliente (Outbound) */}
            {formData.documentType === 'outbound' && (
              <div className="border-t pt-6 mb-6">
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-900">Dados do Cliente (API 2.0 - Saída) *</h3>
                      <p className="text-sm text-green-700">Obrigatório para documentos de saída</p>
                    </div>
                    <button onClick={() => setShowCustomerFields(!showCustomerFields)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                      {showCustomerFields ? <><ChevronUp className="w-4 h-4" />Ocultar</> : <><ChevronDown className="w-4 h-4" />Preencher Dados</>}
                    </button>
                  </div>
                </div>
                {showCustomerFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-green-900 mb-2">CNPJ/CPF Cliente *</label>
                      <input type="text" value={customerData.cnpjCpf || ''}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 14) setCustomerData({...customerData, cnpjCpf: v}); }}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if ((v.length === 11 || v.length === 14) && savedSuppliers[v]) {
                            const s = savedSuppliers[v];
                            setCustomerData({ cnpjCpf: s.cnpjCpf, name: s.name, personType: s.personType, neighborhood: s.neighborhood, zipCode: s.zipCode, complement: s.complement, description: '', address: s.address, number: s.number, city: s.city, state: s.state });
                            notify('✅ Dados do cliente carregados!');
                          }
                        }}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                        placeholder="Digite o CNPJ/CPF" />
                    </div>
                    {Object.keys(savedSuppliers).length > 0 && (
                      <div className="md:col-span-2 mb-2">
                        <label className="block text-sm font-medium text-green-900 mb-2">Ou selecione um cliente cadastrado:</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {Object.keys(savedSuppliers).map(cnpj => (
                            <button key={cnpj}
                              onClick={() => { const s = savedSuppliers[cnpj]; setCustomerData({ cnpjCpf: s.cnpjCpf, name: s.name, personType: s.personType, neighborhood: s.neighborhood, zipCode: s.zipCode, complement: s.complement, description: '', address: s.address, number: s.number, city: s.city, state: s.state }); notify('✅ Dados do cliente carregados!'); }}
                              className="px-3 py-1 bg-white border border-green-300 rounded-lg text-sm text-green-700 hover:bg-green-100 transition-colors">
                              {cnpj} - {savedSuppliers[cnpj].name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {[
                      ['name', 'Nome do Cliente *', 'NOME DO CLIENTE', 'md:col-span-2'],
                      ['zipCode', 'CEP', '00000-000'],
                      ['address', 'Endereço', 'RUA EXEMPLO', 'md:col-span-2'],
                      ['number', 'Número', '123'],
                      ['neighborhood', 'Bairro', 'CENTRO'],
                      ['complement', 'Complemento', 'APTO 101'],
                      ['city', 'Cidade', 'SAO PAULO'],
                    ].map(([field, label, placeholder, colSpan]) => (
                      <div key={field} className={colSpan || ''}>
                        <label className="block text-sm font-medium text-green-900 mb-2">{label}</label>
                        <input type="text" value={customerData[field] || ''}
                          onChange={(e) => setCustomerData({...customerData, [field]: e.target.value})}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                          placeholder={placeholder} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-green-900 mb-2">Tipo Pessoa</label>
                      <select value={customerData.personType || 'J'} onChange={(e) => setCustomerData({...customerData, personType: e.target.value})}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white">
                        <option value="J">Jurídica</option><option value="F">Física</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-900 mb-2">Estado</label>
                      <input type="text" value={customerData.state || ''}
                        onChange={(e) => { const v = e.target.value.toUpperCase(); if (v.length <= 2) setCustomerData({...customerData, state: v}); }}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                        placeholder="SP" maxLength="2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-green-900 mb-2">Descrição</label>
                      <input type="text" value={customerData.description || ''}
                        onChange={(e) => setCustomerData({...customerData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                        placeholder="Informações adicionais" />
                    </div>
                  </div>
                )}

                {/* Transportadora */}
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-yellow-900">Dados da Transportadora (Opcional)</h3>
                      <p className="text-sm text-yellow-700">Preencha apenas se houver transportadora</p>
                    </div>
                    <button onClick={() => setShowCarrierFields(!showCarrierFields)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors">
                      {showCarrierFields ? <><ChevronUp className="w-4 h-4" />Ocultar</> : <><ChevronDown className="w-4 h-4" />Preencher Dados</>}
                    </button>
                  </div>
                </div>
                {showCarrierFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-yellow-900 mb-2">CNPJ/CPF Transportadora</label>
                      <div className="flex gap-2">
                        <input type="text" value={carrierData.cnpjCpf || ''}
                          onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 14) setCarrierData({...carrierData, cnpjCpf: v}); }}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v.length === 11 || v.length === 14) {
                              if (!loadCarrierByCnpj(v) && savedSuppliers[v]) {
                                const s = savedSuppliers[v];
                                setCarrierData({ cnpjCpf: s.cnpjCpf, name: s.name, personType: s.personType, neighborhood: s.neighborhood, address: s.address, number: s.number, city: s.city, zipCode: s.zipCode, state: s.state, complement: s.complement, description: '' });
                                notify('✅ Dados carregados (fornecedor)!');
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                          placeholder="Digite o CNPJ/CPF" />
                        {carrierData.cnpjCpf && (carrierData.cnpjCpf.length === 11 || carrierData.cnpjCpf.length === 14) && (
                          <button onClick={() => saveCarrier(carrierData.cnpjCpf, carrierData)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2">
                            <Copy className="w-4 h-4" />Salvar
                          </button>
                        )}
                      </div>
                    </div>
                    {Object.keys(savedCarriers).length > 0 && (
                      <div className="md:col-span-2 mb-2">
                        <label className="block text-sm font-medium text-yellow-900 mb-2">Ou selecione uma transportadora cadastrada:</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {Object.keys(savedCarriers).map(cnpj => (
                            <button key={cnpj}
                              onClick={() => { const c = savedCarriers[cnpj]; setCarrierData({ cnpjCpf: c.cnpjCpf, name: c.name, personType: c.personType, neighborhood: c.neighborhood, address: c.address, number: c.number, city: c.city, zipCode: c.zipCode, state: c.state, complement: c.complement, description: c.description || '' }); notify('✅ Dados da transportadora carregados!'); }}
                              className="px-3 py-1 bg-white border border-yellow-300 rounded-lg text-sm text-yellow-700 hover:bg-yellow-100 transition-colors">
                              {cnpj} - {savedCarriers[cnpj].name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {[
                      ['name', 'Nome da Transportadora', 'TRANSPORTADORA XYZ LTDA', 'md:col-span-2'],
                      ['zipCode', 'CEP', '00000-000'],
                      ['address', 'Endereço', 'RUA EXEMPLO', 'md:col-span-2'],
                      ['number', 'Número', '123'],
                      ['neighborhood', 'Bairro', 'CENTRO'],
                      ['complement', 'Complemento', 'GALPÃO 5'],
                      ['city', 'Cidade', 'SAO PAULO'],
                    ].map(([field, label, placeholder, colSpan]) => (
                      <div key={field} className={colSpan || ''}>
                        <label className="block text-sm font-medium text-yellow-900 mb-2">{label}</label>
                        <input type="text" value={carrierData[field] || ''}
                          onChange={(e) => setCarrierData({...carrierData, [field]: e.target.value})}
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                          placeholder={placeholder} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-yellow-900 mb-2">Tipo Pessoa</label>
                      <select value={carrierData.personType || 'J'} onChange={(e) => setCarrierData({...carrierData, personType: e.target.value})}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white">
                        <option value="J">Jurídica</option><option value="F">Física</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-yellow-900 mb-2">Estado</label>
                      <input type="text" value={carrierData.state || ''}
                        onChange={(e) => { const v = e.target.value.toUpperCase(); if (v.length <= 2) setCarrierData({...carrierData, state: v}); }}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                        placeholder="SP" maxLength="2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-yellow-900 mb-2">Descrição</label>
                      <input type="text" value={carrierData.description || ''}
                        onChange={(e) => setCarrierData({...carrierData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                        placeholder="Informações adicionais" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Excel */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Importar Planilha (Opcional)</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />Selecionar Arquivo Excel
                  <input type="file" accept=".xlsx,.xls,.xlsm" onChange={handleFileUpload} className="hidden" />
                </label>
                <div className="relative">
                  <button type="button" onMouseEnter={() => setShowExcelHelp(true)} onMouseLeave={() => setShowExcelHelp(false)}
                    onClick={(e) => { e.preventDefault(); setShowExcelHelp(!showExcelHelp); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                    <HelpCircle className="w-5 h-5" />
                  </button>
                  {showExcelHelp && (
                    <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white border-2 border-blue-300 rounded-lg shadow-2xl p-4 z-50"
                      onMouseEnter={() => setShowExcelHelp(true)} onMouseLeave={() => setShowExcelHelp(false)}>
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><FileJson className="w-5 h-5" />Formato da Planilha Excel</h4>
                      <p className="text-sm text-blue-700 mb-2">A planilha deve conter as seguintes colunas (A1 até H1):</p>
                      <div className="grid grid-cols-1 gap-1 text-xs font-mono bg-blue-50 p-3 rounded border border-blue-200">
                        {['codigoProduto','quantidadeMovimento','tipoUc','fatorTipoUc','classeProduto','valorUnitario','tipoLogistico','dadoLogistico'].map((col, i) => (
                          <div key={col} className="text-blue-600">{String.fromCharCode(65+i)}1: {col}</div>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">💡 Os dados devem começar na linha 2 (linha 1 são os cabeçalhos)</p>
                    </div>
                  )}
                </div>
              </div>
              {uploadError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-4"><strong>Erro: </strong>{uploadError}</div>}
              {uploadedFileName && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileJson className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Arquivo Carregado</p>
                      <p className="text-sm text-green-700">{uploadedFileName}</p>
                      <p className="text-xs text-green-600">{products.length} produtos importados</p>
                    </div>
                  </div>
                  <button onClick={clearUploadedFile} className="text-red-500 hover:text-red-700 transition-colors"><X className="w-6 h-6" /></button>
                </div>
              )}
            </div>

            {/* Produtos */}
            <div className="border-t pt-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Produtos</h3>
                <button onClick={addProduct} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />Adicionar Produto
                </button>
              </div>
              {products.map((product, index) => (
                <div key={index} className="border rounded-lg p-4 mb-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Produto {index + 1}</h4>
                    {products.length > 1 && (
                      <button onClick={() => removeProduct(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código Produto (EAN) *</label>
                      <input type="text" value={product.codigoProduto} onChange={(e) => updateProduct(index, 'codigoProduto', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="7898970092551" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                      <input type="number" value={product.quantidadeMovimento} onChange={(e) => updateProduct(index, 'quantidadeMovimento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo UC</label>
                      <select value={product.tipoUc} onChange={(e) => updateProduct(index, 'tipoUc', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <option value="UN">UN</option><option value="CX">CX</option><option value="KG">KG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fator Tipo UC</label>
                      <input type="text" value={product.fatorTipoUc} onChange={(e) => updateProduct(index, 'fatorTipoUc', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Classe Produto</label>
                      <input type="text" value={product.classeProduto} onChange={(e) => updateProduct(index, 'classeProduto', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="00" maxLength="2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor Unitário</label>
                      <input type="number" step="0.01" value={product.valorUnitario} onChange={(e) => updateProduct(index, 'valorUnitario', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" min="0" placeholder="1.00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Logístico</label>
                      <select value={product.tipoLogistico} onChange={(e) => updateProduct(index, 'tipoLogistico', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                        <option value="1">1 - Sem Lote</option><option value="3">3 - Com Lote</option>
                      </select>
                    </div>
                    {product.tipoLogistico === '3' && (
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dado Logístico *</label>
                        <input type="text" value={product.dadoLogistico} onChange={(e) => updateProduct(index, 'dadoLogistico', e.target.value)}
                          className="w-full px-3 py-2 border border-yellow-400 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Informação do dado logístico (obrigatório quando tipo = 3)" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button onClick={generateJsonFromForm}
                className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-lg shadow-lg transition-all transform hover:scale-105">
                <FileJson className="w-6 h-6" />Gerar JSON
              </button>
            </div>
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedores'}</h2>
              <p className="text-sm text-gray-600">Cadastre fornecedores individualmente ou importe em massa via Excel</p>
            </div>

            {!editingSupplier && (
              <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-purple-900 flex items-center gap-2"><Upload className="w-5 h-5" />Importação em Massa</h3>
                    <p className="text-sm text-purple-700">Importe múltiplos fornecedores de uma vez</p>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />Selecionar Arquivo
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleSuppliersFileUpload} className="hidden" />
                  </label>
                </div>
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="text-xs font-semibold text-purple-900 mb-2">📋 Colunas aceitas (primeira linha da planilha):</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {['Empresas', 'EmpresaDescrição', 'CNPJ'].map(c => <span key={c} className="px-2 py-1 bg-purple-100 text-purple-800 rounded font-mono">{c}</span>)}
                      <span className="text-red-600 font-bold">*obrigatório</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {['Empresa', 'Nome'].map(c => <span key={c} className="px-2 py-1 bg-purple-100 text-purple-800 rounded font-mono">{c}</span>)}
                      <span className="text-red-600 font-bold">*obrigatório</span>
                    </div>
                    <div className="text-gray-700"><span className="font-semibold">Opcionais:</span> Endereço, Número, Bairro, CEP, Município, UF, Tipo Pessoa</div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-b mb-6 pb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Ou cadastre individualmente:</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-900 mb-2">CNPJ/CPF *</label>
                <input type="text"
                  value={editingSupplier ? editingSupplier.cnpjCpf : newSupplier.cnpjCpf}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 14) { editingSupplier ? setEditingSupplier({...editingSupplier, cnpjCpf: v}) : setNewSupplier({...newSupplier, cnpjCpf: v}); } }}
                  disabled={!!editingSupplier}
                  className={`w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${editingSupplier ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="00000000000000" />
                <p className="text-xs text-gray-500 mt-1">CPF: 11 dígitos | CNPJ: 14 dígitos (apenas números)</p>
              </div>
              {[
                ['name', 'Nome do Fornecedor *', 'EI BELEZA SERVICOS LTDA', 'md:col-span-2'],
                ['zipCode', 'CEP', '06696-110'],
                ['address', 'Endereço', 'RODOVIA CORONEL NELSON TRANCHESI', 'md:col-span-2'],
                ['number', 'Número', 'S/N'],
                ['neighborhood', 'Bairro', 'ITAPEVI'],
                ['complement', 'Complemento', 'N/A'],
                ['city', 'Cidade', 'SAO PAULO'],
              ].map(([field, label, placeholder, colSpan]) => (
                <div key={field} className={colSpan || ''}>
                  <label className="block text-sm font-medium text-blue-900 mb-2">{label}</label>
                  <input type="text"
                    value={editingSupplier ? (editingSupplier[field] || '') : (newSupplier[field] || '')}
                    onChange={(e) => editingSupplier ? setEditingSupplier({...editingSupplier, [field]: e.target.value}) : setNewSupplier({...newSupplier, [field]: e.target.value})}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Tipo Pessoa</label>
                <select value={editingSupplier ? editingSupplier.personType : newSupplier.personType}
                  onChange={(e) => editingSupplier ? setEditingSupplier({...editingSupplier, personType: e.target.value}) : setNewSupplier({...newSupplier, personType: e.target.value})}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="J">Jurídica</option><option value="F">Física</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Estado</label>
                <input type="text"
                  value={editingSupplier ? (editingSupplier.state || '') : (newSupplier.state || '')}
                  onChange={(e) => { const v = e.target.value.toUpperCase(); if (v.length <= 2) { editingSupplier ? setEditingSupplier({...editingSupplier, state: v}) : setNewSupplier({...newSupplier, state: v}); } }}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="SP" maxLength="2" />
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <button onClick={saveSupplierFromForm} className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
                <Check className="w-5 h-5" />{editingSupplier ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}
              </button>
              {editingSupplier && (
                <button onClick={cancelEdit} className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors">
                  <X className="w-5 h-5" />Cancelar
                </button>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Fornecedores Cadastrados ({Object.keys(savedSuppliers).length})</h3>
              {Object.keys(savedSuppliers).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileJson className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhum fornecedor cadastrado ainda</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(savedSuppliers).map(([cnpj, supplier]) => (
                    <div key={cnpj} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{supplier.name}</h4>
                          <p className="text-sm text-gray-600 font-mono">{cnpj}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${supplier.personType === 'J' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {supplier.personType === 'J' ? 'Jurídica' : 'Física'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1 mb-3">
                        {supplier.address && <p>📍 {supplier.address}, {supplier.number}</p>}
                        {supplier.neighborhood && <p>🏘️ {supplier.neighborhood}</p>}
                        {supplier.city && <p>🏙️ {supplier.city} - {supplier.state}</p>}
                        {supplier.zipCode && <p>📮 {supplier.zipCode}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditSupplier(cnpj)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors">
                          <FileEdit className="w-4 h-4" />Editar
                        </button>
                        <button onClick={() => deleteSupplier(cnpj)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors">
                          <Trash2 className="w-4 h-4" />Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Carriers Tab */}
        {activeTab === 'carriers' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{editingCarrier ? 'Editar Transportadora' : 'Cadastrar Transportadoras'}</h2>
              <p className="text-sm text-gray-600">Cadastre transportadoras para usar em documentos de saída (Outbound)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-yellow-900 mb-2">CNPJ/CPF *</label>
                <input type="text"
                  value={editingCarrier ? editingCarrier.cnpjCpf : newCarrier.cnpjCpf}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 14) { editingCarrier ? setEditingCarrier({...editingCarrier, cnpjCpf: v}) : setNewCarrier({...newCarrier, cnpjCpf: v}); } }}
                  disabled={!!editingCarrier}
                  className={`w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white ${editingCarrier ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="00000000000000" />
              </div>
              {[
                ['name', 'Nome da Transportadora *', 'TRANSPORTADORA XYZ LTDA', 'md:col-span-2'],
                ['zipCode', 'CEP', '00000-000'],
                ['address', 'Endereço', 'RUA EXEMPLO', 'md:col-span-2'],
                ['number', 'Número', '123'],
                ['neighborhood', 'Bairro', 'CENTRO'],
                ['complement', 'Complemento', 'GALPÃO 5'],
                ['city', 'Cidade', 'SAO PAULO'],
                ['description', 'Descrição', 'Informações adicionais', 'md:col-span-2'],
              ].map(([field, label, placeholder, colSpan]) => (
                <div key={field} className={colSpan || ''}>
                  <label className="block text-sm font-medium text-yellow-900 mb-2">{label}</label>
                  <input type="text"
                    value={editingCarrier ? (editingCarrier[field] || '') : (newCarrier[field] || '')}
                    onChange={(e) => editingCarrier ? setEditingCarrier({...editingCarrier, [field]: e.target.value}) : setNewCarrier({...newCarrier, [field]: e.target.value})}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                    placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-yellow-900 mb-2">Tipo Pessoa</label>
                <select value={editingCarrier ? editingCarrier.personType : newCarrier.personType}
                  onChange={(e) => editingCarrier ? setEditingCarrier({...editingCarrier, personType: e.target.value}) : setNewCarrier({...newCarrier, personType: e.target.value})}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white">
                  <option value="J">Jurídica</option><option value="F">Física</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-yellow-900 mb-2">Estado</label>
                <input type="text"
                  value={editingCarrier ? (editingCarrier.state || '') : (newCarrier.state || '')}
                  onChange={(e) => { const v = e.target.value.toUpperCase(); if (v.length <= 2) { editingCarrier ? setEditingCarrier({...editingCarrier, state: v}) : setNewCarrier({...newCarrier, state: v}); } }}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                  placeholder="SP" maxLength="2" />
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <button onClick={saveCarrierFromForm} className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
                <Check className="w-5 h-5" />{editingCarrier ? 'Atualizar Transportadora' : 'Cadastrar Transportadora'}
              </button>
              {editingCarrier && (
                <button onClick={cancelEditCarrier} className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors">
                  <X className="w-5 h-5" />Cancelar
                </button>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Transportadoras Cadastradas ({Object.keys(savedCarriers).length})</h3>
              {Object.keys(savedCarriers).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhuma transportadora cadastrada ainda</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(savedCarriers).map(([cnpj, carrier]) => (
                    <div key={cnpj} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{carrier.name}</h4>
                          <p className="text-sm text-gray-600 font-mono">{cnpj}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${carrier.personType === 'J' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {carrier.personType === 'J' ? 'Jurídica' : 'Física'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1 mb-3">
                        {carrier.address && <p>📍 {carrier.address}, {carrier.number}</p>}
                        {carrier.neighborhood && <p>🏘️ {carrier.neighborhood}</p>}
                        {carrier.city && <p>🏙️ {carrier.city} - {carrier.state}</p>}
                        {carrier.zipCode && <p>📮 {carrier.zipCode}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditCarrier(cnpj)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded transition-colors">
                          <FileEdit className="w-4 h-4" />Editar
                        </button>
                        <button onClick={() => deleteCarrier(cnpj)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors">
                          <Trash2 className="w-4 h-4" />Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
