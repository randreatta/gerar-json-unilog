import React, { useState } from 'react';
import {
  ArrowRight, Copy, Check, ChevronDown, ChevronUp,
  Plus, Trash2, FileEdit, Upload, HelpCircle, X,
  Building2, Truck, Code2, LayoutDashboard
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Toaster, toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const storage = {
  get: (key) => { const v = localStorage.getItem(key); return v ? { value: v } : null; },
  set: (key, value) => localStorage.setItem(key, value),
};

const navItems = [
  { id: 'creator',   label: 'Gerar JSON',       icon: LayoutDashboard },
  { id: 'converter', label: 'Payload',           icon: Code2 },
  { id: 'suppliers', label: 'Fornecedores',      icon: Building2 },
  { id: 'carriers',  label: 'Transportadoras',   icon: Truck },
];

export default function JsonConverter() {
  const [activeTab, setActiveTab] = useState('creator');

  // ── Converter state ──────────────────────────────────────────
  const [inputJson,  setInputJson]  = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [error,      setError]      = useState('');
  const [copied,     setCopied]     = useState(false);
  const [copiedInput,setCopiedInput]= useState(false);

  // ── Upload state ─────────────────────────────────────────────
  const [uploadError,       setUploadError]       = useState('');
  const [uploadedFileName,  setUploadedFileName]  = useState('');
  const [showExcelHelp,     setShowExcelHelp]     = useState(false);

  // ── Saved entities ────────────────────────────────────────────
  const [savedSuppliers, setSavedSuppliers] = useState({});
  const [savedCarriers,  setSavedCarriers]  = useState({});
  const [editingSupplier,setEditingSupplier]= useState(null);
  const [editingCarrier, setEditingCarrier] = useState(null);

  const emptySupplier = { cnpjCpf:'', name:'', personType:'J', zipCode:'', address:'', number:'', neighborhood:'', complement:'', city:'', state:'' };
  const emptyCarrier  = { cnpjCpf:'', name:'', personType:'J', zipCode:'', address:'', number:'', neighborhood:'', complement:'', city:'', state:'', description:'' };
  const [newSupplier, setNewSupplier] = useState({ ...emptySupplier });
  const [newCarrier,  setNewCarrier]  = useState({ ...emptyCarrier });

  // ── Form state ────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    cnpjCpfEmpresa:'', codigoEstabelecimento:8, tipoDocumento:'CINV',
    serieDocumento:'1', numeroDocumento:'', descricaoNaturezaOperacao:'SEM VALOR FISCAL',
    informacaoAdicional:'', valorTotalDocumento:0, valorTotalProduto:0,
    valorDesconto:0, valorFrete:0, valorSeguro:0, documentType:'inbound',
  });

  const [supplierData, setSupplierData] = useState({ cnpjCpf:'', neighborhood:'', zipCode:'', complement:'', name:'', address:'', number:'', city:'', personType:'J', state:'' });
  const [customerData, setCustomerData] = useState({ cnpjCpf:'', name:'', personType:'J', neighborhood:'', zipCode:'', complement:'', description:'', address:'', number:'', city:'', state:'' });
  const [carrierData,  setCarrierData]  = useState({ cnpjCpf:'', name:'', personType:'J', neighborhood:'', address:'', number:'', city:'', zipCode:'', state:'', complement:'', description:'' });

  const [showSupplierFields, setShowSupplierFields] = useState(false);
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [showCarrierFields,  setShowCarrierFields]  = useState(false);

  const emptyProduct = { codigoProduto:'', quantidadeMovimento:0, tipoUc:'UN', fatorTipoUc:'1', classeProduto:'00', valorUnitario:1.0, tipoLogistico:'1', dadoLogistico:'' };
  const [products, setProducts] = useState([{ ...emptyProduct }]);

  // ── Load from storage ─────────────────────────────────────────
  React.useEffect(() => {
    try { const r = storage.get('suppliers-data'); if (r) setSavedSuppliers(JSON.parse(r.value)); } catch {}
    try { const r = storage.get('carriers-data');  if (r) setSavedCarriers(JSON.parse(r.value));  } catch {}
  }, []);

  // ── Helpers ───────────────────────────────────────────────────
  const notify = (msg) => toast.success(msg);

  const copyToClipboard = (text, isInput = false) => {
    if (!text) { toast.error('Não há conteúdo para copiar!'); return; }
    const set = isInput ? setCopiedInput : setCopied;
    navigator.clipboard?.writeText(text)
      .then(() => { set(true); setTimeout(() => set(false), 2000); })
      .catch(() => {
        const el = Object.assign(document.createElement('textarea'), { value: text });
        el.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(el); el.select();
        document.execCommand('copy'); document.body.removeChild(el);
        set(true); setTimeout(() => set(false), 2000);
      });
  };

  // ── Suppliers ─────────────────────────────────────────────────
  const saveSupplier = (cnpjCpf, data) => {
    const updated = { ...savedSuppliers, [cnpjCpf]: { ...data, lastUpdated: new Date().toISOString() } };
    storage.set('suppliers-data', JSON.stringify(updated)); setSavedSuppliers(updated);
    notify('Fornecedor salvo!');
  };
  const loadSupplierByCnpj = (cnpjCpf) => {
    if (cnpjCpf && savedSuppliers[cnpjCpf]) {
      setSupplierData({ ...savedSuppliers[cnpjCpf] }); notify('Dados do fornecedor carregados!'); return true;
    } return false;
  };
  const deleteSupplier = (cnpjCpf) => {
    if (!window.confirm(`Excluir fornecedor ${cnpjCpf}?`)) return;
    const updated = { ...savedSuppliers }; delete updated[cnpjCpf];
    storage.set('suppliers-data', JSON.stringify(updated)); setSavedSuppliers(updated);
    notify('Fornecedor excluído!');
  };
  const saveSupplierFromForm = () => {
    const s = editingSupplier || newSupplier;
    if (!s.cnpjCpf || (s.cnpjCpf.length !== 11 && s.cnpjCpf.length !== 14)) { toast.error('CNPJ/CPF deve ter 11 ou 14 dígitos!'); return; }
    if (!s.name) { toast.error('Nome obrigatório!'); return; }
    const updated = { ...savedSuppliers, [s.cnpjCpf]: { ...s, lastUpdated: new Date().toISOString() } };
    storage.set('suppliers-data', JSON.stringify(updated)); setSavedSuppliers(updated);
    setNewSupplier({ ...emptySupplier }); setEditingSupplier(null);
    notify(editingSupplier ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!');
  };
  const startEditSupplier = (cnpjCpf) => { setEditingSupplier({ ...savedSuppliers[cnpjCpf] }); setActiveTab('suppliers'); };

  // ── Carriers ──────────────────────────────────────────────────
  const saveCarrier = (cnpjCpf, data) => {
    const updated = { ...savedCarriers, [cnpjCpf]: { ...data, lastUpdated: new Date().toISOString() } };
    storage.set('carriers-data', JSON.stringify(updated)); setSavedCarriers(updated);
    notify('Transportadora salva!');
  };
  const loadCarrierByCnpj = (cnpjCpf) => {
    if (cnpjCpf && savedCarriers[cnpjCpf]) {
      setCarrierData({ ...savedCarriers[cnpjCpf] }); notify('Dados da transportadora carregados!'); return true;
    } return false;
  };
  const deleteCarrier = (cnpjCpf) => {
    if (!window.confirm(`Excluir transportadora ${cnpjCpf}?`)) return;
    const updated = { ...savedCarriers }; delete updated[cnpjCpf];
    storage.set('carriers-data', JSON.stringify(updated)); setSavedCarriers(updated);
    notify('Transportadora excluída!');
  };
  const saveCarrierFromForm = () => {
    const c = editingCarrier || newCarrier;
    if (!c.cnpjCpf || (c.cnpjCpf.length !== 11 && c.cnpjCpf.length !== 14)) { toast.error('CNPJ/CPF deve ter 11 ou 14 dígitos!'); return; }
    if (!c.name) { toast.error('Nome obrigatório!'); return; }
    const updated = { ...savedCarriers, [c.cnpjCpf]: { ...c, lastUpdated: new Date().toISOString() } };
    storage.set('carriers-data', JSON.stringify(updated)); setSavedCarriers(updated);
    setNewCarrier({ ...emptyCarrier }); setEditingCarrier(null);
    notify(editingCarrier ? 'Transportadora atualizada!' : 'Transportadora cadastrada!');
  };
  const startEditCarrier = (cnpjCpf) => { setEditingCarrier({ ...savedCarriers[cnpjCpf] }); setActiveTab('carriers'); };

  // ── Suppliers bulk import ─────────────────────────────────────
  const handleSuppliersFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        let workbook;
        if (file.name.toLowerCase().endsWith('.csv')) {
          workbook = XLSX.read(new TextDecoder('windows-1252').decode(data), { type: 'string', raw: true });
        } else { workbook = XLSX.read(data, { type: 'array' }); }
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (!jsonData.length) { toast.error('Planilha vazia!'); return; }
        const cols = Object.keys(jsonData[0]);
        const find = (names) => cols.find(c => names.some(n => c.trim().toLowerCase().replace(/\s+/g,'') === n.toLowerCase().replace(/\s+/g,'')));
        const colCNPJ = find(['EmpresaDescrição','EmpresaDescricao','Empresa Descrição','Empresas','CNPJ','CPF']);
        const colNome = find(['Empresa','Nome','Razão Social','RazaoSocial']);
        if (!colCNPJ || !colNome) { toast.error('Colunas CNPJ/Nome não encontradas!'); return; }
        const colEnd  = find(['Endereço','Endereco','End']);
        const colNum  = find(['Número','Numero','Nro']);
        const colBairro = find(['Bairro']);
        const colCEP  = find(['CEP']);
        const colMun  = find(['Município','Municipio','Cidade']);
        const colUF   = find(['UF','Estado']);
        const colTipo = find(['Tipo Pessoa','TipoPessoa','Tipo']);
        let ok = 0, fail = 0;
        const newSuppliers = { ...savedSuppliers };
        jsonData.forEach((row) => {
          const cnpjCpf = String(row[colCNPJ] || '').replace(/\D/g,'');
          if (!cnpjCpf || (cnpjCpf.length !== 11 && cnpjCpf.length !== 14) || !row[colNome]) { fail++; return; }
          newSuppliers[cnpjCpf] = { cnpjCpf, name: String(row[colNome]||'').toUpperCase(), address: String(row[colEnd]||'').toUpperCase(), number: String(row[colNum]||'S/N'), neighborhood: String(row[colBairro]||'').toUpperCase(), zipCode: String(row[colCEP]||'').replace(/\D/g,''), city: String(row[colMun]||'').toUpperCase(), state: String(row[colUF]||'').toUpperCase(), personType: colTipo && row[colTipo]==='F' ? 'F' : 'J', complement:'N/A', lastUpdated: new Date().toISOString() };
          ok++;
        });
        storage.set('suppliers-data', JSON.stringify(newSuppliers)); setSavedSuppliers(newSuppliers);
        e.target.value = '';
        toast.success(`${ok} fornecedores importados${fail ? ` (${fail} erros)` : ''}!`);
      } catch (err) { toast.error(`Erro: ${err.message}`); }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Products ──────────────────────────────────────────────────
  const addProduct    = () => setProducts([...products, { ...emptyProduct }]);
  const removeProduct = (i) => setProducts(products.filter((_,idx) => idx !== i));
  const updateProduct = (i, field, value) => { const p = [...products]; p[i][field] = value; setProducts(p); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadError(''); setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const jsonData = XLSX.utils.sheet_to_json(XLSX.read(new Uint8Array(ev.target.result), { type:'array' }).Sheets[XLSX.read(new Uint8Array(ev.target.result), { type:'array' }).SheetNames[0]]);
        if (!jsonData.length) { setUploadError('Planilha vazia.'); setUploadedFileName(''); return; }
        setProducts(jsonData.map(r => ({ codigoProduto: String(r.codigoProduto||''), quantidadeMovimento: parseInt(r.quantidadeMovimento)||0, tipoUc: String(r.tipoUc||'UN'), fatorTipoUc: String(r.fatorTipoUc||'1'), classeProduto: String(r.classeProduto||'00'), valorUnitario: parseFloat(r.valorUnitario)||1.0, tipoLogistico: String(r.tipoLogistico||'1'), dadoLogistico: String(r.dadoLogistico||'') })));
        e.target.value = ''; notify(`${jsonData.length} produtos importados!`);
      } catch (err) { setUploadError(err.message); setUploadedFileName(''); }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Generate JSON from form ───────────────────────────────────
  const generateJsonFromForm = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    setInputJson(JSON.stringify({
      documentos: [{
        agrupador:0, cnpjCpfEmpresa: formData.cnpjCpfEmpresa, cnpjCpfTransportadora:'',
        codigoEstabelecimento: formData.codigoEstabelecimento, codigoDepositante: formData.cnpjCpfEmpresa,
        tipoDocumento: formData.tipoDocumento.toUpperCase(), serieDocumento: formData.serieDocumento,
        codigoEmpresa: formData.cnpjCpfEmpresa, codigoTransportadora:'',
        descricaoNaturezaOperacao: formData.descricaoNaturezaOperacao.toUpperCase(),
        dataEmissao: dateStr, dataPrevisaoMovimento: dateStr,
        valorTotalDocumento: parseFloat(formData.valorTotalDocumento)||0, valorTotalProduto: parseFloat(formData.valorTotalProduto)||0,
        valorBaseIcmsSub:0, valorDesconto: parseFloat(formData.valorDesconto)||0,
        valorFrete: parseFloat(formData.valorFrete)||0, valorIcmsSub:0,
        valorSeguro: parseFloat(formData.valorSeguro)||0, quantidadeVolume:0,
        numeroDocumento: formData.numeroDocumento, naturezaOperacao:'0000',
        informacaoAdicional: formData.informacaoAdicional.toUpperCase(),
        detalhes: products.map(p => ({ codigoEmpresa: formData.cnpjCpfEmpresa, codigoProduto: p.codigoProduto, quantidadeMovimento: parseInt(p.quantidadeMovimento)||0, tipoUc: p.tipoUc.toUpperCase(), fatorTipoUc: p.fatorTipoUc, classeProduto: p.classeProduto.toUpperCase(), valorUnitario: parseFloat(p.valorUnitario)||1.0, tipoLogistico: p.tipoLogistico, dadoLogistico: p.dadoLogistico.toUpperCase() }))
      }]
    }, null, 2));
    notify('JSON gerado com sucesso!');
    setActiveTab('converter');
    setTimeout(() => window.scrollTo({ top:0, behavior:'smooth' }), 100);
  };

  // ── Convert JSON ──────────────────────────────────────────────
  const convertJson = () => {
    try {
      setError('');
      const input = JSON.parse(inputJson);
      if (!input.documentos?.length) throw new Error('Propriedade "documentos" não encontrada');
      const isOutbound = formData.documentType === 'outbound';
      const orders = input.documentos.map(doc => {
        const now = new Date();
        const bt = new Date(now.toLocaleString('en-US', { timeZone:'America/Sao_Paulo' }));
        const currentDate = `${bt.getFullYear()}-${String(bt.getMonth()+1).padStart(2,'0')}-${String(bt.getDate()).padStart(2,'0')}T${String(bt.getHours()).padStart(2,'0')}:${String(bt.getMinutes()).padStart(2,'0')}:${String(bt.getSeconds()).padStart(2,'0')}-03:00`;
        const uniqueProd = new Set((doc.detalhes||[]).map(i => i.codigoProduto).filter(Boolean));
        const base = { wareHouseCode: doc.codigoEstabelecimento||0, expectedMovementDate: currentDate, orderNumber: doc.numeroDocumento||'', orderSeries: doc.serieDocumento||'01', orderType: doc.tipoDocumento||'NFE', nfeAccessKey:'00000000000000000000000000000000000000000000', issueDate: currentDate, additionValue:0, discountValue: doc.valorDesconto||0, freightValue: doc.valorFrete||0, insuranceValue: doc.valorSeguro||0, totalOrderValue: doc.valorTotalDocumento||0, totalProductValue: doc.valorTotalProduto||0, grossWeight:0, netWeight:0, volumeQuantity: uniqueProd.size||1 };
        const common = { nfeAuthorizationDate:null, nfeProtocol:null, transportMode:null, volumeTrackingCode:null, additionalInfo1:null, additionalInfo2:null, additionalInfo3:null, cfop:null, shelfLifeRemainingPercent:null, costCenter:null };
        const items = (doc.detalhes||[]).map(item => ({ productClass: item.classeProduto||'00', ean: item.codigoProduto||'', batchCode: item.dadoLogistico||null, purchaseUnitFactor: parseInt(item.fatorTipoUc)||1, purchaseUnitType: item.tipoUc||'UN', expirationDate:null, quantity: item.quantidadeMovimento||0, additionValue:0, discountValue:0, serviceValue:0, unitValue: parseFloat(item.valorUnitario)||0, fiscalUnitValue:0 }));
        if (isOutbound) {
          const customer = { cnpjCpf: customerData.cnpjCpf||doc.cnpjCpfCliente||'', name: customerData.name||'CLIENTE PADRAO', personType: customerData.personType||'J', neighborhood: customerData.neighborhood||'CENTRO', zipCode: customerData.zipCode||'00000-000', complement: customerData.complement||'N/A', description: customerData.description||doc.descricaoNaturezaOperacao||'', address: customerData.address||'RUA PADRAO', number: customerData.number||'S/N', city: customerData.city||'SAO PAULO', state: customerData.state||'SP' };
          const carrier = carrierData.cnpjCpf ? { cnpjCpf: carrierData.cnpjCpf, name: carrierData.name||null, description: carrierData.description||null, personType: carrierData.personType||'J', neighborhood: carrierData.neighborhood||null, address: carrierData.address||null, number: carrierData.number||null, city: carrierData.city||null, zipCode: carrierData.zipCode||null, state: carrierData.state||null, complement: carrierData.complement||null } : { cnpjCpf:null, name:null, description:null, personType:null, neighborhood:null, address:null, number:null, city:null, zipCode:null, state:null, complement:null };
          return { ...base, ...common, salesChannel:'B2B', items, project:{code:null,name:null}, customer, carrier, shippingLabel:{content:null,type:null}, shippingAddress:{cnpjCpf:null,name:null,description:null,personType:null,neighborhood:null,address:null,number:null,city:null,zipCode:null,state:null,complement:null} };
        } else {
          const supplier = { neighborhood: supplierData.neighborhood||'CENTRO', zipCode: supplierData.zipCode||'00000-000', cnpjCpf: supplierData.cnpjCpf||doc.cnpjCpfEmpresa||'', complement: supplierData.complement||'N/A', name: supplierData.name||'FORNECEDOR PADRAO', description: doc.descricaoNaturezaOperacao||'', address: supplierData.address||'RUA PADRAO', number: supplierData.number||'S/N', city: supplierData.city||'SAO PAULO', personType: supplierData.personType||'J', state: supplierData.state||'SP' };
          const carrierIn = carrierData.cnpjCpf ? { neighborhood: carrierData.neighborhood||null, zipCode: carrierData.zipCode||null, cnpjCpf: carrierData.cnpjCpf, complement: carrierData.complement||null, name: carrierData.name||null, description: carrierData.description||null, address: carrierData.address||null, city: carrierData.city||null, number: carrierData.number||null, personType: carrierData.personType||'J', state: carrierData.state||null } : null;
          return { ...base, ...common, items, supplier, ...(carrierIn && { carrier: carrierIn }) };
        }
      });
      setOutputJson(JSON.stringify({ orders, packingList:null }, null, 2));
    } catch (err) { setError(`Erro: ${err.message}`); setOutputJson(''); }
  };

  const loadSampleJson = () => setInputJson(JSON.stringify({ documentos:[{ agrupador:0, cnpjCpfEmpresa:'59769230000243', cnpjCpfTransportadora:'', codigoEstabelecimento:8, codigoDepositante:'59769230000243', tipoDocumento:'CINV', serieDocumento:'1', codigoEmpresa:'59769230000243', codigoTransportadora:'', descricaoNaturezaOperacao:'SEM VALOR FISCAL', dataEmissao:'2025-10-23 10:00:00', dataPrevisaoMovimento:'2025-10-23 10:00:00', valorTotalDocumento:0, valorTotalProduto:0, valorBaseIcmsSub:0, valorDesconto:0, valorFrete:0, valorIcmsSub:0, valorSeguro:0, quantidadeVolume:0, numeroDocumento:'2932', naturezaOperacao:'0000', informacaoAdicional:'SOLICITACAO DE ENTRADA VIA BITRIX, CHAMADO: 2937.', detalhes:[{ codigoEmpresa:'35705066000242', codigoProduto:'7898970092551', quantidadeMovimento:12, tipoUc:'UN', fatorTipoUc:'1', classeProduto:'00', valorUnitario:1.0, tipoLogistico:'1', dadoLogistico:'' },{ codigoEmpresa:'35705066000242', codigoProduto:'7898749570631', quantidadeMovimento:24, tipoUc:'UN', fatorTipoUc:'1', classeProduto:'00', valorUnitario:1.0, tipoLogistico:'1', dadoLogistico:'' }] }] }, null, 2));

  // ── Reusable form field helpers ───────────────────────────────
  const FormField = ({ label, children, className }) => (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {children}
    </div>
  );

  const SectionCard = ({ title, subtitle, colorClass = 'border-gray-200', children }) => (
    <Card className={cn('border', colorClass)}>
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>{children}</CardContent>
    </Card>
  );

  const EntityCard = ({ entity, type, onEdit, onDelete }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{entity.name}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{entity.cnpjCpf}</p>
          </div>
          <Badge variant={entity.personType === 'J' ? 'secondary' : 'outline'} className="ml-2 shrink-0">
            {entity.personType === 'J' ? 'Jurídica' : 'Física'}
          </Badge>
        </div>
        <div className="text-xs text-gray-500 space-y-0.5 mb-4">
          {entity.address && <p>📍 {entity.address}{entity.number ? `, ${entity.number}` : ''}</p>}
          {entity.city && <p>🏙️ {entity.city}{entity.state ? ` - ${entity.state}` : ''}</p>}
          {entity.zipCode && <p>📮 {entity.zipCode}</p>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 gap-1.5">
            <FileEdit className="w-3.5 h-3.5" />Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete} className="flex-1 gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ── Address fields block ──────────────────────────────────────
  const AddressFields = ({ data, setData, colorPrefix }) => (
    <>
      <FormField label="CEP">
        <Input value={data.zipCode||''} onChange={e => setData({...data, zipCode: e.target.value})} placeholder="00000-000" />
      </FormField>
      <FormField label="Endereço" className="md:col-span-2">
        <Input value={data.address||''} onChange={e => setData({...data, address: e.target.value})} placeholder="Rua Exemplo" />
      </FormField>
      <FormField label="Número">
        <Input value={data.number||''} onChange={e => setData({...data, number: e.target.value})} placeholder="S/N" />
      </FormField>
      <FormField label="Bairro">
        <Input value={data.neighborhood||''} onChange={e => setData({...data, neighborhood: e.target.value})} placeholder="Centro" />
      </FormField>
      <FormField label="Complemento">
        <Input value={data.complement||''} onChange={e => setData({...data, complement: e.target.value})} placeholder="N/A" />
      </FormField>
      <FormField label="Cidade">
        <Input value={data.city||''} onChange={e => setData({...data, city: e.target.value})} placeholder="São Paulo" />
      </FormField>
      <FormField label="Estado">
        <Input value={data.state||''} onChange={e => { const v = e.target.value.toUpperCase(); if (v.length<=2) setData({...data, state:v}); }} placeholder="SP" maxLength={2} />
      </FormField>
    </>
  );

  // ── Saved entity selector ─────────────────────────────────────
  const SavedSelector = ({ saved, onSelect, colorClass }) => {
    if (!Object.keys(saved).length) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(saved).map(([cnpj, e]) => (
          <button key={cnpj} onClick={() => onSelect(cnpj)}
            className={cn('px-3 py-1.5 text-xs rounded-full border bg-white transition-colors hover:bg-gray-50 font-medium', colorClass)}>
            {cnpj} — {e.name}
          </button>
        ))}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" richColors />

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-white border-r border-border flex flex-col shadow-sm">
        <div className="p-6 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Menu</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-5 flex items-center gap-4 shrink-0">
          <img src="/unilog-logo.png" alt="Unilog" className="h-10 w-auto object-contain" />
          <Separator orientation="vertical" className="h-10" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Criação JSON</h1>
            <p className="text-sm text-muted-foreground">Conversor de JSON — Unilog Express</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* ═══════════ GERAR JSON ═══════════ */}
          {activeTab === 'creator' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <SectionCard>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Tipo de Movimentação */}
                  <div className="md:col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">Tipo de Movimentação</Label>
                    <div className="flex gap-4">
                      {[['inbound','📥 Entrada (Inbound)'],['outbound','📤 Saída (Outbound)']].map(([val, lbl]) => (
                        <label key={val} className={cn('flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-lg border-2 transition-colors flex-1 justify-center', formData.documentType===val ? 'border-primary bg-accent text-accent-foreground font-medium' : 'border-border text-muted-foreground hover:border-primary/40')}>
                          <input type="radio" name="documentType" value={val} checked={formData.documentType===val} onChange={e => setFormData({...formData, documentType:e.target.value})} className="sr-only" />
                          {lbl}
                        </label>
                      ))}
                    </div>
                  </div>

                  <FormField label="CNPJ/CPF Empresa *">
                    <Input value={formData.cnpjCpfEmpresa} onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=14) setFormData({...formData,cnpjCpfEmpresa:v}); }} placeholder="00000000000000" />
                    <p className="text-xs text-muted-foreground mt-1">11 dígitos (CPF) ou 14 dígitos (CNPJ)</p>
                  </FormField>

                  <FormField label="Código Estabelecimento">
                    <Input value={formData.codigoEstabelecimento} onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=2) setFormData({...formData,codigoEstabelecimento:v}); }} placeholder="8" />
                  </FormField>

                  <FormField label="Tipo Documento">
                    <Select value={formData.tipoDocumento} onValueChange={v => setFormData({...formData,tipoDocumento:v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CINV">CINV</SelectItem>
                        <SelectItem value="NFE">NFE</SelectItem>
                        <SelectItem value="NFS">NFS</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Série Documento">
                    <Input value={formData.serieDocumento} onChange={e => setFormData({...formData,serieDocumento:e.target.value.replace(/\D/g,'')})} placeholder="1" />
                  </FormField>

                  <FormField label="Número Documento *">
                    <Input value={formData.numeroDocumento} onChange={e => setFormData({...formData,numeroDocumento:e.target.value})} placeholder="Ex: 2932" />
                  </FormField>

                  <FormField label="Natureza Operação">
                    <Input value={formData.descricaoNaturezaOperacao} onChange={e => setFormData({...formData,descricaoNaturezaOperacao:e.target.value})} />
                  </FormField>

                  <FormField label="Informação Adicional" className="md:col-span-2">
                    <textarea value={formData.informacaoAdicional} onChange={e => setFormData({...formData,informacaoAdicional:e.target.value})}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" rows={2} />
                  </FormField>
                </div>
              </SectionCard>

              {/* Fornecedor */}
              {formData.documentType === 'inbound' && (
                <Card className="border border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base text-blue-900">Dados do Fornecedor</CardTitle>
                        <p className="text-sm text-blue-600 mt-0.5">Obrigatório para a API 2.0</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowSupplierFields(!showSupplierFields)} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                        {showSupplierFields ? <><ChevronUp className="w-4 h-4 mr-1.5"/>Ocultar</> : <><ChevronDown className="w-4 h-4 mr-1.5"/>Preencher</>}
                      </Button>
                    </div>
                  </CardHeader>
                  {showSupplierFields && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="CNPJ/CPF Fornecedor *" className="md:col-span-2">
                          <div className="flex gap-2">
                            <Input value={supplierData.cnpjCpf||''} onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=14) setSupplierData({...supplierData,cnpjCpf:v}); }} onBlur={e => { const v=e.target.value; if(v.length===11||v.length===14) loadSupplierByCnpj(v); }} placeholder="Digite para carregar automaticamente" className="flex-1" />
                            {(supplierData.cnpjCpf?.length===11||supplierData.cnpjCpf?.length===14) && (
                              <Button size="sm" variant="outline" onClick={() => saveSupplier(supplierData.cnpjCpf, supplierData)} className="shrink-0">Salvar</Button>
                            )}
                          </div>
                        </FormField>
                        {Object.keys(savedSuppliers).length > 0 && (
                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground mb-2 block">Fornecedores salvos:</Label>
                            <SavedSelector saved={savedSuppliers} colorClass="border-blue-200 text-blue-700 hover:border-blue-400"
                              onSelect={cnpj => { setSupplierData({...supplierData,cnpjCpf:cnpj}); loadSupplierByCnpj(cnpj); }} />
                          </div>
                        )}
                        <FormField label="Nome *" className="md:col-span-2">
                          <Input value={supplierData.name||''} onChange={e => setSupplierData({...supplierData,name:e.target.value})} placeholder="Nome do fornecedor" />
                        </FormField>
                        <FormField label="Tipo Pessoa">
                          <Select value={supplierData.personType||'J'} onValueChange={v => setSupplierData({...supplierData,personType:v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="J">Jurídica</SelectItem><SelectItem value="F">Física</SelectItem></SelectContent>
                          </Select>
                        </FormField>
                        <AddressFields data={supplierData} setData={setSupplierData} />
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Cliente */}
              {formData.documentType === 'outbound' && (
                <>
                  <Card className="border border-green-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-green-900">Dados do Cliente</CardTitle>
                          <p className="text-sm text-green-600 mt-0.5">Obrigatório para documentos de saída</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowCustomerFields(!showCustomerFields)} className="border-green-300 text-green-700 hover:bg-green-50">
                          {showCustomerFields ? <><ChevronUp className="w-4 h-4 mr-1.5"/>Ocultar</> : <><ChevronDown className="w-4 h-4 mr-1.5"/>Preencher</>}
                        </Button>
                      </div>
                    </CardHeader>
                    {showCustomerFields && (
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField label="CNPJ/CPF Cliente *" className="md:col-span-2">
                            <Input value={customerData.cnpjCpf||''} onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=14) setCustomerData({...customerData,cnpjCpf:v}); }}
                              onBlur={e => { const v=e.target.value; if((v.length===11||v.length===14)&&savedSuppliers[v]) { const s=savedSuppliers[v]; setCustomerData({cnpjCpf:s.cnpjCpf,name:s.name,personType:s.personType,neighborhood:s.neighborhood,zipCode:s.zipCode,complement:s.complement,description:'',address:s.address,number:s.number,city:s.city,state:s.state}); notify('Dados do cliente carregados!'); } }}
                              placeholder="Digite para carregar automaticamente" />
                          </FormField>
                          {Object.keys(savedSuppliers).length > 0 && (
                            <div className="md:col-span-2">
                              <Label className="text-xs text-muted-foreground mb-2 block">Clientes salvos:</Label>
                              <SavedSelector saved={savedSuppliers} colorClass="border-green-200 text-green-700 hover:border-green-400"
                                onSelect={cnpj => { const s=savedSuppliers[cnpj]; setCustomerData({cnpjCpf:s.cnpjCpf,name:s.name,personType:s.personType,neighborhood:s.neighborhood,zipCode:s.zipCode,complement:s.complement,description:'',address:s.address,number:s.number,city:s.city,state:s.state}); notify('Dados do cliente carregados!'); }} />
                            </div>
                          )}
                          <FormField label="Nome *" className="md:col-span-2">
                            <Input value={customerData.name||''} onChange={e => setCustomerData({...customerData,name:e.target.value})} placeholder="Nome do cliente" />
                          </FormField>
                          <FormField label="Tipo Pessoa">
                            <Select value={customerData.personType||'J'} onValueChange={v => setCustomerData({...customerData,personType:v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="J">Jurídica</SelectItem><SelectItem value="F">Física</SelectItem></SelectContent>
                            </Select>
                          </FormField>
                          <AddressFields data={customerData} setData={setCustomerData} />
                          <FormField label="Descrição" className="md:col-span-2">
                            <Input value={customerData.description||''} onChange={e => setCustomerData({...customerData,description:e.target.value})} placeholder="Informações adicionais" />
                          </FormField>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Transportadora */}
                  <Card className="border border-amber-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-amber-900">Dados da Transportadora</CardTitle>
                          <p className="text-sm text-amber-600 mt-0.5">Opcional</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowCarrierFields(!showCarrierFields)} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                          {showCarrierFields ? <><ChevronUp className="w-4 h-4 mr-1.5"/>Ocultar</> : <><ChevronDown className="w-4 h-4 mr-1.5"/>Preencher</>}
                        </Button>
                      </div>
                    </CardHeader>
                    {showCarrierFields && (
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField label="CNPJ/CPF Transportadora" className="md:col-span-2">
                            <div className="flex gap-2">
                              <Input value={carrierData.cnpjCpf||''} onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=14) setCarrierData({...carrierData,cnpjCpf:v}); }}
                                onBlur={e => { const v=e.target.value; if(v.length===11||v.length===14) { if(!loadCarrierByCnpj(v)&&savedSuppliers[v]) { const s=savedSuppliers[v]; setCarrierData({cnpjCpf:s.cnpjCpf,name:s.name,personType:s.personType,neighborhood:s.neighborhood,address:s.address,number:s.number,city:s.city,zipCode:s.zipCode,state:s.state,complement:s.complement,description:''}); notify('Dados carregados!'); } } }}
                                placeholder="Digite para carregar automaticamente" className="flex-1" />
                              {(carrierData.cnpjCpf?.length===11||carrierData.cnpjCpf?.length===14) && (
                                <Button size="sm" variant="outline" onClick={() => saveCarrier(carrierData.cnpjCpf, carrierData)} className="shrink-0">Salvar</Button>
                              )}
                            </div>
                          </FormField>
                          {Object.keys(savedCarriers).length > 0 && (
                            <div className="md:col-span-2">
                              <Label className="text-xs text-muted-foreground mb-2 block">Transportadoras salvas:</Label>
                              <SavedSelector saved={savedCarriers} colorClass="border-amber-200 text-amber-700 hover:border-amber-400"
                                onSelect={cnpj => { const c=savedCarriers[cnpj]; setCarrierData({...c}); notify('Transportadora carregada!'); }} />
                            </div>
                          )}
                          <FormField label="Nome" className="md:col-span-2">
                            <Input value={carrierData.name||''} onChange={e => setCarrierData({...carrierData,name:e.target.value})} placeholder="Nome da transportadora" />
                          </FormField>
                          <FormField label="Tipo Pessoa">
                            <Select value={carrierData.personType||'J'} onValueChange={v => setCarrierData({...carrierData,personType:v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="J">Jurídica</SelectItem><SelectItem value="F">Física</SelectItem></SelectContent>
                            </Select>
                          </FormField>
                          <AddressFields data={carrierData} setData={setCarrierData} />
                          <FormField label="Descrição" className="md:col-span-2">
                            <Input value={carrierData.description||''} onChange={e => setCarrierData({...carrierData,description:e.target.value})} placeholder="Informações adicionais" />
                          </FormField>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </>
              )}

              {/* Import Excel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Importar Produtos via Planilha</CardTitle>
                  <p className="text-sm text-muted-foreground">Opcional — importa os produtos de um arquivo Excel</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                      <label className="cursor-pointer gap-2 flex items-center">
                        <Upload className="w-4 h-4" />Selecionar Excel
                        <input type="file" accept=".xlsx,.xls,.xlsm" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </Button>
                    <button onMouseEnter={() => setShowExcelHelp(true)} onMouseLeave={() => setShowExcelHelp(false)} className="text-muted-foreground hover:text-foreground transition-colors relative">
                      <HelpCircle className="w-4 h-4" />
                      {showExcelHelp && (
                        <div className="absolute left-6 top-0 z-50 w-72 bg-white border border-border rounded-lg shadow-lg p-4 text-left">
                          <p className="font-semibold text-sm mb-2">Colunas esperadas (linha 1):</p>
                          <div className="font-mono text-xs space-y-0.5 text-muted-foreground">
                            {['codigoProduto','quantidadeMovimento','tipoUc','fatorTipoUc','classeProduto','valorUnitario','tipoLogistico','dadoLogistico'].map((c,i) => (
                              <p key={c}><span className="text-primary">{String.fromCharCode(65+i)}1:</span> {c}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                    {uploadedFileName && (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-1.5">
                        <Check className="w-3.5 h-3.5" />{uploadedFileName} ({products.length} itens)
                        <button onClick={() => { setUploadedFileName(''); setProducts([{...emptyProduct}]); }} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                  {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Produtos</CardTitle>
                      <p className="text-sm text-muted-foreground">{products.length} produto{products.length!==1?'s':''} adicionado{products.length!==1?'s':''}</p>
                    </div>
                    <Button size="sm" onClick={addProduct} className="gap-1.5">
                      <Plus className="w-4 h-4" />Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {products.map((product, index) => (
                    <div key={index} className="rounded-lg border border-border p-4 bg-gray-50/50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">Produto {index+1}</span>
                        {products.length > 1 && (
                          <Button size="sm" variant="ghost" onClick={() => removeProduct(index)} className="text-muted-foreground hover:text-destructive h-7 w-7 p-0">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <FormField label="EAN / Código Produto *" className="md:col-span-3">
                          <Input value={product.codigoProduto} onChange={e => updateProduct(index,'codigoProduto',e.target.value)} placeholder="7898970092551" />
                        </FormField>
                        <FormField label="Quantidade *">
                          <Input type="number" min="0" value={product.quantidadeMovimento} onChange={e => updateProduct(index,'quantidadeMovimento',e.target.value)} />
                        </FormField>
                        <FormField label="Tipo UC">
                          <Select value={product.tipoUc} onValueChange={v => updateProduct(index,'tipoUc',v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UN">UN</SelectItem>
                              <SelectItem value="CX">CX</SelectItem>
                              <SelectItem value="KG">KG</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Fator UC">
                          <Input value={product.fatorTipoUc} onChange={e => updateProduct(index,'fatorTipoUc',e.target.value)} placeholder="1" />
                        </FormField>
                        <FormField label="Classe Produto">
                          <Input value={product.classeProduto} onChange={e => updateProduct(index,'classeProduto',e.target.value)} placeholder="00" maxLength={2} />
                        </FormField>
                        <FormField label="Valor Unitário">
                          <Input type="number" step="0.01" min="0" value={product.valorUnitario} onChange={e => updateProduct(index,'valorUnitario',e.target.value)} placeholder="1.00" />
                        </FormField>
                        <FormField label="Tipo Logístico">
                          <Select value={product.tipoLogistico} onValueChange={v => updateProduct(index,'tipoLogistico',v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 — Sem Lote</SelectItem>
                              <SelectItem value="3">3 — Com Lote</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                        {product.tipoLogistico === '3' && (
                          <FormField label="Dado Logístico *" className="md:col-span-3">
                            <Input value={product.dadoLogistico} onChange={e => updateProduct(index,'dadoLogistico',e.target.value)} placeholder="Obrigatório quando tipo = 3" className="border-amber-300 focus-visible:ring-amber-400" />
                          </FormField>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button onClick={generateJsonFromForm} className="w-full mt-2 gap-2" size="lg">
                    Gerar JSON
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════ PAYLOAD ═══════════ */}
          {activeTab === 'converter' && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 flex items-center gap-4">
                <Label className="text-sm font-medium">Tipo de Movimentação:</Label>
                <div className="flex gap-3">
                  {[['inbound','📥 Entrada'],['outbound','📤 Saída']].map(([val,lbl]) => (
                    <label key={val} className={cn('flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors', formData.documentType===val ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-primary/40')}>
                      <input type="radio" name="docType2" value={val} checked={formData.documentType===val} onChange={e => setFormData({...formData,documentType:e.target.value})} className="sr-only" />{lbl}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">JSON de Entrada (API 1.0)</CardTitle>
                        <div className="flex gap-2">
                          {inputJson && (
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(inputJson,true)} className="gap-1.5">
                              {copiedInput ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
                              {copiedInput ? 'Copiado!' : 'Copiar'}
                            </Button>
                          )}
                          {inputJson && <Button size="sm" variant="ghost" onClick={() => setInputJson('')} className="gap-1.5"><Trash2 className="w-3.5 h-3.5"/>Limpar</Button>}
                          <Button size="sm" variant="ghost" onClick={loadSampleJson}>Exemplo</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <textarea value={inputJson} onChange={e => setInputJson(e.target.value)}
                        placeholder='Cole aqui o JSON no formato "documentos"...'
                        className="w-full h-96 p-3 rounded-md border border-input bg-background font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                    </CardContent>
                  </Card>
                  <Button onClick={convertJson} disabled={!inputJson} className="w-full gap-2" size="lg">
                    Converter para API 2.0 <ArrowRight className="w-4 h-4" />
                  </Button>
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </div>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">JSON de Saída (API 2.0)</CardTitle>
                        {outputJson && (() => { try { const p=JSON.parse(outputJson); return <Badge variant="outline" className="mt-1 text-xs">{p.orders?.[0]?.customer ? '📤 Outbound' : '📥 Inbound'}</Badge>; } catch { return null; } })()}
                      </div>
                      {outputJson && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(outputJson,false)} className="gap-1.5">
                            {copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
                            {copied ? 'Copiado!' : 'Copiar'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setOutputJson('')} className="gap-1.5"><Trash2 className="w-3.5 h-3.5"/>Limpar</Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <textarea value={outputJson} readOnly
                      className="w-full h-96 p-3 rounded-md border border-input bg-muted font-mono text-xs resize-none focus-visible:outline-none" />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ═══════════ FORNECEDORES ═══════════ */}
          {activeTab === 'suppliers' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Bulk import */}
              {!editingSupplier && (
                <Card className="border border-violet-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base text-violet-900">Importação em Massa</CardTitle>
                        <p className="text-sm text-violet-600 mt-0.5">Importe vários fornecedores de uma planilha</p>
                      </div>
                      <Button asChild variant="outline" size="sm" className="border-violet-300 text-violet-700 hover:bg-violet-50">
                        <label className="cursor-pointer gap-2 flex items-center">
                          <Upload className="w-4 h-4" />Selecionar Arquivo
                          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleSuppliersFileUpload} className="hidden" />
                        </label>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-violet-50 rounded-md p-3 text-xs text-violet-700 space-y-1">
                      <p><strong>Colunas obrigatórias:</strong> Empresas / CNPJ (CNPJ ou CPF) · Empresa / Nome</p>
                      <p><strong>Opcionais:</strong> Endereço · Número · Bairro · CEP · Município · UF · Tipo Pessoa</p>
                      <p><strong>Formatos:</strong> .CSV · .XLS · .XLSX</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="CNPJ/CPF *" className="md:col-span-2">
                      <Input value={editingSupplier ? editingSupplier.cnpjCpf : newSupplier.cnpjCpf}
                        onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=14) { editingSupplier ? setEditingSupplier({...editingSupplier,cnpjCpf:v}) : setNewSupplier({...newSupplier,cnpjCpf:v}); } }}
                        disabled={!!editingSupplier} placeholder="00000000000000" />
                      <p className="text-xs text-muted-foreground mt-1">11 dígitos (CPF) ou 14 dígitos (CNPJ)</p>
                    </FormField>
                    <FormField label="Nome *" className="md:col-span-2">
                      <Input value={editingSupplier ? editingSupplier.name : newSupplier.name}
                        onChange={e => editingSupplier ? setEditingSupplier({...editingSupplier,name:e.target.value}) : setNewSupplier({...newSupplier,name:e.target.value})}
                        placeholder="Nome do fornecedor" />
                    </FormField>
                    <FormField label="Tipo Pessoa">
                      <Select value={editingSupplier ? editingSupplier.personType : newSupplier.personType}
                        onValueChange={v => editingSupplier ? setEditingSupplier({...editingSupplier,personType:v}) : setNewSupplier({...newSupplier,personType:v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="J">Jurídica</SelectItem><SelectItem value="F">Física</SelectItem></SelectContent>
                      </Select>
                    </FormField>
                    {/* Address */}
                    {(['zipCode','address','number','neighborhood','complement','city','state']).map(field => {
                      const labels = { zipCode:'CEP', address:'Endereço', number:'Número', neighborhood:'Bairro', complement:'Complemento', city:'Cidade', state:'Estado' };
                      const placeholders = { zipCode:'00000-000', address:'Rua Exemplo', number:'S/N', neighborhood:'Centro', complement:'N/A', city:'São Paulo', state:'SP' };
                      const val = editingSupplier ? (editingSupplier[field]||'') : (newSupplier[field]||'');
                      const onChange = e => {
                        let v = e.target.value;
                        if (field === 'state') { v = v.toUpperCase(); if (v.length > 2) return; }
                        editingSupplier ? setEditingSupplier({...editingSupplier,[field]:v}) : setNewSupplier({...newSupplier,[field]:v});
                      };
                      return (
                        <FormField key={field} label={labels[field]} className={field==='address' ? 'md:col-span-2' : ''}>
                          <Input value={val} onChange={onChange} placeholder={placeholders[field]} maxLength={field==='state'?2:undefined} />
                        </FormField>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button onClick={saveSupplierFromForm} className="gap-1.5">
                      <Check className="w-4 h-4" />{editingSupplier ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                    {editingSupplier && (
                      <Button variant="outline" onClick={() => { setEditingSupplier(null); setNewSupplier({...emptySupplier}); }} className="gap-1.5">
                        <X className="w-4 h-4" />Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* List */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                  Fornecedores Cadastrados ({Object.keys(savedSuppliers).length})
                </h3>
                {!Object.keys(savedSuppliers).length ? (
                  <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-border">
                    <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum fornecedor cadastrado ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(savedSuppliers).map(([cnpj, s]) => (
                      <EntityCard key={cnpj} entity={s} type="supplier"
                        onEdit={() => startEditSupplier(cnpj)}
                        onDelete={() => deleteSupplier(cnpj)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ TRANSPORTADORAS ═══════════ */}
          {activeTab === 'carriers' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{editingCarrier ? 'Editar Transportadora' : 'Cadastrar Transportadora'}</CardTitle>
                  <p className="text-sm text-muted-foreground">Para uso em documentos de saída (Outbound)</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="CNPJ/CPF *" className="md:col-span-2">
                      <Input value={editingCarrier ? editingCarrier.cnpjCpf : newCarrier.cnpjCpf}
                        onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=14) { editingCarrier ? setEditingCarrier({...editingCarrier,cnpjCpf:v}) : setNewCarrier({...newCarrier,cnpjCpf:v}); } }}
                        disabled={!!editingCarrier} placeholder="00000000000000" />
                    </FormField>
                    <FormField label="Nome *" className="md:col-span-2">
                      <Input value={editingCarrier ? editingCarrier.name : newCarrier.name}
                        onChange={e => editingCarrier ? setEditingCarrier({...editingCarrier,name:e.target.value}) : setNewCarrier({...newCarrier,name:e.target.value})}
                        placeholder="Nome da transportadora" />
                    </FormField>
                    <FormField label="Tipo Pessoa">
                      <Select value={editingCarrier ? editingCarrier.personType : newCarrier.personType}
                        onValueChange={v => editingCarrier ? setEditingCarrier({...editingCarrier,personType:v}) : setNewCarrier({...newCarrier,personType:v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="J">Jurídica</SelectItem><SelectItem value="F">Física</SelectItem></SelectContent>
                      </Select>
                    </FormField>
                    {(['zipCode','address','number','neighborhood','complement','city','state','description']).map(field => {
                      const labels = { zipCode:'CEP', address:'Endereço', number:'Número', neighborhood:'Bairro', complement:'Complemento', city:'Cidade', state:'Estado', description:'Descrição' };
                      const placeholders = { zipCode:'00000-000', address:'Rua Exemplo', number:'123', neighborhood:'Centro', complement:'Galpão 5', city:'São Paulo', state:'SP', description:'Informações adicionais' };
                      const val = editingCarrier ? (editingCarrier[field]||'') : (newCarrier[field]||'');
                      const onChange = e => {
                        let v = e.target.value;
                        if (field === 'state') { v = v.toUpperCase(); if (v.length > 2) return; }
                        editingCarrier ? setEditingCarrier({...editingCarrier,[field]:v}) : setNewCarrier({...newCarrier,[field]:v});
                      };
                      return (
                        <FormField key={field} label={labels[field]} className={field==='address'||field==='description' ? 'md:col-span-2' : ''}>
                          <Input value={val} onChange={onChange} placeholder={placeholders[field]} maxLength={field==='state'?2:undefined} />
                        </FormField>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button onClick={saveCarrierFromForm} className="gap-1.5">
                      <Check className="w-4 h-4" />{editingCarrier ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                    {editingCarrier && (
                      <Button variant="outline" onClick={() => { setEditingCarrier(null); setNewCarrier({...emptyCarrier}); }} className="gap-1.5">
                        <X className="w-4 h-4" />Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                  Transportadoras Cadastradas ({Object.keys(savedCarriers).length})
                </h3>
                {!Object.keys(savedCarriers).length ? (
                  <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-border">
                    <Truck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma transportadora cadastrada ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(savedCarriers).map(([cnpj, c]) => (
                      <EntityCard key={cnpj} entity={c} type="carrier"
                        onEdit={() => startEditCarrier(cnpj)}
                        onDelete={() => deleteCarrier(cnpj)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
