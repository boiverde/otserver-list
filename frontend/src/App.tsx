import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Server, Plus, Shield, Users, Activity, Crown, Copy, ExternalLink, Check, Trash2, Star, StarOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WHATSAPP_URL = import.meta.env.VITE_WHATSAPP_URL || 'https://wa.me/5511999999999?text=Gostaria%20de%20destacar%20meu%20servidor';

// --- Types ---
interface ServerData {
  id: string;
  name: string;
  ip: string;
  port: number;
  version: string;
  type: string;
  website: string | null;
  playersOnline: number;
  maxPlayers: number;
  isFeatured: boolean;
  approved: boolean;
  isOnline?: boolean;
  lastCheckedAt?: string;
  statusError?: string;
  ownerEmail: string;
}

// --- Components ---

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Server className="text-primary" />
        <span>OTServer List</span>
      </Link>
      <div className="nav-links">
        <Link to="/otservers" className="btn btn-secondary" style={{ border: 'none' }}>Lista</Link>
        <Link to="/otservers-baiak" className="btn btn-secondary" style={{ border: 'none' }}>Baiak</Link>
        <Link to="/otservers-global" className="btn btn-secondary" style={{ border: 'none' }}>Global</Link>
        <Link to="/otservers-86" className="btn btn-secondary" style={{ border: 'none' }}>8.60</Link>
        <Link to="/submit" className="btn btn-primary">
          <Plus size={18} /> Adicionar Servidor
        </Link>
      </div>
    </nav>
  );
}

function ServerCard({ server, isTop3 }: { server: ServerData, isTop3?: boolean }) {
  return (
    <div className={`server-card ${server.isFeatured ? 'featured' : ''} ${isTop3 ? 'top3' : ''}`} style={isTop3 && !server.isFeatured ? { border: '1px solid #eab308' } : {}}>
      {server.isFeatured && (
        <div className="featured-badge">
          <Crown size={12} style={{ display: 'inline', marginRight: '4px' }} /> Premium
        </div>
      )}
      {isTop3 && !server.isFeatured && (
        <div className="featured-badge" style={{ backgroundColor: '#eab308', color: '#000' }}>
          🔥 Em Alta
        </div>
      )}
      <div className="server-header">
        <div>
          <Link to={`/server/${server.id}`}>
            <h3 className="server-name" style={{ cursor: 'pointer' }}>{server.name}</h3>
          </Link>
          <span className="server-ip">{server.ip}:{server.port}</span>
        </div>
      </div>
      
      <div className="server-stats">
        <div className="stat-item">
          <Activity size={16} className={server.isOnline ? "stat-online" : "stat-offline"} style={!server.isOnline ? {color: '#ff4b4b'} : {}} />
          <span>Status: <span className={server.isOnline ? "stat-online" : "stat-offline"} style={!server.isOnline ? {color: '#ff4b4b'} : {}}>{server.isOnline ? 'Online' : 'Offline'}</span></span>
        </div>
        <div className="stat-item">
          <Users size={16} />
          <span>Players: <span className="stat-value">{server.playersOnline} {server.maxPlayers > 0 ? `/ ${server.maxPlayers}` : ''}</span></span>
        </div>
      </div>

      <div className="server-details">
        <div className="detail-item">
          <span className="detail-label">Versão</span>
          <span className="detail-value">{server.version}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Tipo</span>
          <span className="detail-value">{server.type}</span>
        </div>
        {server.lastCheckedAt && (
          <div className="detail-item" style={{ marginTop: '0.5rem', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
            <span className="detail-label" style={{fontSize: '0.8rem'}}>Players online reais</span>
            <span className="detail-value" style={{fontSize: '0.8rem'}}>
              Atualizado há {Math.floor((new Date().getTime() - new Date(server.lastCheckedAt).getTime()) / 60000)} min
            </span>
          </div>
        )}
      </div>

      <Link to={`/server/${server.id}`} className="btn btn-secondary w-full text-center mt-4" style={{ justifyContent: 'center' }}>
        Ver Detalhes
      </Link>
    </div>
  );
}

function MonetizationBanner() {
  return (
    <div style={{ background: 'linear-gradient(45deg, #2b1055, #7522d1)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary)' }}>
      <div>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Crown size={20} color="var(--featured)" /> Quer destacar seu servidor?</h3>
        <p style={{ margin: '0.5rem 0 0 0', color: '#e2d6ff' }}>Seu servidor aparece no topo da lista por 7 dias. Destaque inicial: R$ 50/semana via PIX.</p>
      </div>
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn" style={{ backgroundColor: '#25D366', color: 'white' }}>
        Falar no WhatsApp
      </a>
    </div>
  );
}

const SEO_PAGES: Record<string, { title: string, desc: string, filter: (s: ServerData) => boolean }> = {
  '/': { title: 'Os Melhores OTServers', desc: 'Encontre e divulgue os melhores servidores de Tibia alternativos do Brasil e do mundo.', filter: () => true },
  '/otservers': { title: 'Lista Completa de OTServers', desc: 'Navegue por todos os servidores aprovados em nossa plataforma.', filter: () => true },
  '/otservers-baiak': { title: 'OTServers Baiak', desc: 'Ação rápida, PVP intenso e diversão garantida nos melhores Baiaks.', filter: (s) => s.name.toLowerCase().includes('baiak') || s.type.toLowerCase().includes('baiak') },
  '/otservers-global': { title: 'OTServers Global', desc: 'Experiência oficial com mapa completo e rates customizadas.', filter: (s) => s.type.toLowerCase() === 'global' || s.name.toLowerCase().includes('global') },
  '/otservers-86': { title: 'OTServers 8.60', desc: 'A versão mais clássica e amada do Tibia.', filter: (s) => s.version.includes('8.6') },
  '/otservers-15': { title: 'OTServers Atuais (13+)', desc: 'Servidores nas versões mais recentes com montarias e novas áreas.', filter: (s) => s.version.includes('15') || s.version.includes('14') || s.version.includes('13') },
};

function Home() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const seoData = SEO_PAGES[location.pathname] || SEO_PAGES['/'];

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/servers`)
      .then(res => res.json())
      .then(data => {
        setServers(data.filter(seoData.filter));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch servers', err);
        setLoading(false);
      });
  }, [location.pathname]);

  return (
    <div className="app-container">
      <Navbar />
      <main>
        <section className="hero" style={{ marginBottom: '2rem' }}>
          <h1>{seoData.title}</h1>
          <p>{seoData.desc}</p>
        </section>

        <MonetizationBanner />

        {loading ? (
          <div className="loading">Carregando servidores...</div>
        ) : servers.length === 0 ? (
          <div className="empty-state">
            <Server size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
            <h3>Nenhum servidor encontrado</h3>
            <p style={{ color: 'var(--text-muted)' }}>Não há servidores nesta categoria no momento.</p>
          </div>
        ) : (
          <div className="server-grid">
            {(() => {
              const top3Ids = [...servers]
                .sort((a, b) => b.playersOnline - a.playersOnline)
                .slice(0, 3)
                .map(s => s.id);
              
              return servers.map(server => (
                <ServerCard key={server.id} server={server} isTop3={top3Ids.includes(server.id)} />
              ));
            })()}
          </div>
        )}
      </main>
    </div>
  );
}

function ServerDetails() {
  const { id } = useParams();
  const [server, setServer] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/servers/${id}`)
      .then(res => res.json())
      .then(data => {
        setServer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="app-container"><Navbar /><main><div className="loading">Carregando...</div></main></div>;
  if (!server) return <div className="app-container"><Navbar /><main><div className="empty-state">Servidor não encontrado.</div></main></div>;

  const copyIp = () => {
    navigator.clipboard.writeText(server.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-container">
      <Navbar />
      <main style={{ maxWidth: '800px' }}>
        <div className="form-container" style={{ position: 'relative' }}>
          {server.isFeatured && (
            <div className="featured-badge" style={{ position: 'absolute', top: 0, right: 0, borderTopRightRadius: '16px' }}>
              <Crown size={12} style={{ display: 'inline', marginRight: '4px' }} /> Premium
            </div>
          )}
          
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: server.isFeatured ? 'var(--featured)' : 'var(--text-main)' }}>
            {server.name}
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <span className="server-ip" style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>{server.ip}:{server.port}</span>
            <button onClick={copyIp} className="btn btn-secondary">
              {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />} {copied ? 'Copiado!' : 'Copiar IP'}
            </button>
            {server.website && (
              <a href={server.website.startsWith('http') ? server.website : `https://${server.website}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <ExternalLink size={18} /> Acessar Site
              </a>
            )}
          </div>

          <div className="server-details" style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} /> Online
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Jogadores</span>
              <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> {server.playersOnline} / {server.maxPlayers}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Versão</span>
              <span className="detail-value">{server.version}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Tipo</span>
              <span className="detail-value">{server.type}</span>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Descrição do Servidor</h3>
            <p style={{ lineHeight: '1.8' }}>
              Bem-vindo ao {server.name}! Nosso servidor roda na versão {server.version} e foca no estilo {server.type}. 
              Junte-se aos {server.playersOnline} jogadores ativos. Conecte-se pelo IP <strong>{server.ip}</strong> na porta {server.port}.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function SubmitServer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${API_URL}/servers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Submission failed');
      
      alert('Servidor enviado com sucesso! Ele será analisado pela equipe.');
      navigate('/');
    } catch (err) {
      setError('Falha ao enviar servidor. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main>
        <MonetizationBanner />
        
        <div className="form-container">
          <h2 className="form-title">Cadastre seu OTServer</h2>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome do Servidor</label>
              <input type="text" name="name" className="form-control" required placeholder="Ex: Mega OT" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">IP (Endereço)</label>
                <input type="text" name="ip" className="form-control" required placeholder="go.megaot.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Porta</label>
                <input type="number" name="port" className="form-control" required defaultValue="7171" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Versão</label>
                <input type="text" name="version" className="form-control" required placeholder="12.90" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select name="type" className="form-control" required>
                  <option value="RPG">RPG</option>
                  <option value="PVP">PVP</option>
                  <option value="PVP-Enforced">PVP-Enforced</option>
                  <option value="Global">Global</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website (Opcional)</label>
              <input type="text" name="website" className="form-control" placeholder="https://megaot.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Email do Dono</label>
              <input type="email" name="ownerEmail" className="form-control" required placeholder="admin@megaot.com" />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Para contato em caso de aprovação ou destaque.</small>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-8" style={{ justifyContent: 'center' }} disabled={loading}>
              <Shield size={18} /> {loading ? 'Enviando...' : 'Enviar Servidor para Análise'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Admin() {
  const [secret, setSecret] = useState(localStorage.getItem('adminSecret') || '');
  const [servers, setServers] = useState<ServerData[]>([]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchServers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/servers/${tab}`, {
        method: "GET",
        headers: {
          "secret": secret
        }
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      const data = await res.json();
      setServers(data);
      localStorage.setItem('adminSecret', secret);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (secret) fetchServers();
  }, [tab]);

  const handleAction = async (id: string, action: string, body?: any) => {
    try {
      const headers: HeadersInit = { "secret": secret };
      if (body) {
        headers["Content-Type"] = "application/json";
      }

      const options: RequestInit = {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers,
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      const endpoint = action === 'delete' ? `/servers/${id}` : `/servers/${id}/${action}`;
      
      const res = await fetch(`${API_URL}${endpoint}`, options);
      if (res.ok) {
        fetchServers(); // Refresh list
      } else {
        alert('Action failed: Unauthorized or error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheck = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/servers/${id}/check`, {
        method: 'POST',
        headers: { secret }
      });
      if (res.ok) fetchServers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckAll = async () => {
    try {
      alert("Iniciando checagem de todos os servidores. Isso pode demorar um pouco.");
      const res = await fetch(`${API_URL}/admin/servers/check-all`, {
        method: 'POST',
        headers: { secret }
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Checagem concluída!\nTotal: ${data.total}\nOnline: ${data.online}\nOffline: ${data.offline}\nFalhas: ${data.failed}`);
        fetchServers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <Navbar />
        <main>
          <div className="form-container" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <Shield size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h2>Painel Admin</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Insira a senha mestra para acessar.</p>
            <input 
              type="password" 
              className="form-control" 
              placeholder="ADMIN_SECRET" 
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <button className="btn btn-primary w-full" onClick={fetchServers} style={{ justifyContent: 'center' }}>Acessar</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Painel Administrativo</h2>
          <button className="btn btn-secondary" onClick={() => { localStorage.removeItem('adminSecret'); setIsAuthenticated(false); setSecret(''); }}>
            Sair
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('pending')}>Pendentes</button>
          <button className={`btn ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('all')}>Todos os Servidores</button>
          <button className="btn btn-secondary" style={{marginLeft: 'auto', backgroundColor: '#3b82f6', color: '#fff'}} onClick={handleCheckAll}>
            <Activity size={18} style={{marginRight: '0.5rem'}} /> Atualizar Todos
          </button>
        </div>

        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Nome</th>
                <th style={{ padding: '1rem' }}>Versão/Tipo</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servers.map(server => (
                <tr key={server.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{server.name}</strong><br/>
                    <small style={{ color: 'var(--text-muted)' }}>{server.ip}:{server.port}</small>
                  </td>
                  <td style={{ padding: '1rem' }}>{server.version} / {server.type}</td>
                  <td style={{ padding: '1rem' }}>{server.ownerEmail}</td>
                  <td style={{ padding: '1rem' }}>
                    {!server.approved ? (
                      <span style={{ color: 'var(--danger)' }}>Pendente</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {server.isFeatured && <span style={{ color: 'var(--featured)', fontSize: '0.8rem' }}>⭐ Premium</span>}
                        <span style={{ color: server.isOnline ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>
                          {server.isOnline ? `Online (${server.playersOnline})` : 'Offline'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {server.approved && (
                      <button className="btn" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.4rem' }} title="Atualizar Status" onClick={() => handleCheck(server.id)}>
                        <Activity size={16} />
                      </button>
                    )}
                    {!server.approved && (
                      <button className="btn" style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.4rem' }} title="Aprovar" onClick={() => handleAction(server.id, 'approve')}>
                        <Check size={16} />
                      </button>
                    )}
                    {server.approved && (
                      <button className="btn" style={{ backgroundColor: 'var(--featured)', color: '#000', padding: '0.4rem' }} title="Destacar" onClick={() => handleAction(server.id, 'feature', { isFeatured: !server.isFeatured })}>
                        {server.isFeatured ? <StarOff size={16} /> : <Star size={16} />}
                      </button>
                    )}
                    <button className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.4rem' }} title="Excluir" onClick={() => { if(confirm('Tem certeza?')) handleAction(server.id, 'delete'); }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {servers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum servidor encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {Object.keys(SEO_PAGES).map(path => (
          <Route key={path} path={path} element={<Home />} />
        ))}
        <Route path="/submit" element={<SubmitServer />} />
        <Route path="/server/:id" element={<ServerDetails />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
