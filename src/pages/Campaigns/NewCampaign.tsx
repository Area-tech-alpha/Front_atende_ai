import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/config/api";
import apiClient from "@/lib/api.client";
import { toast } from "react-toastify";

interface Contact {
  name: string;
  phone: string;
}

interface ContactList {
  id: number;
  name?: string;
  contatos: Contact[];
}

const NewCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [campaignName, setCampaignName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState("");
  const [isImmediate, setIsImmediate] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [messageDelay, setMessageDelay] = useState(60);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [selectedContactListId, setSelectedContactListId] = useState<
    number | null
  >(null);
  const [isDraft, setIsDraft] = useState(false);
  const [devices, setDevices] = useState<
    { deviceId: string; connection_name?: string }[]
  >([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraft(true);
    formRef.current?.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true })
    );
  };

  useEffect(() => {
    const fetchContactLists = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.contacts.list);
        const lists = response.data.map((list: any) => ({
          id: list.id,
          name: list.name || `Lista #${list.id}`,
          contatos: JSON.parse(list.contatos || "[]"),
        }));
        setContactLists(lists);
      } catch (err) {
        console.error("Erro ao buscar listas de contatos:", err);
      }
    };
    if (user) fetchContactLists();
  }, [user]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.whatsapp.devices);
        if (Array.isArray(response.data.devices)) {
          setDevices(response.data.devices);
        } else {
          setDevices([]);
        }
      } catch (err) {
        console.error("Erro ao buscar conexões:", err);
        setDevices([]);
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    if (location.state && location.state.reuseCampaign) {
      const c = location.state.reuseCampaign;
      setCampaignName(c.name || "");
      setMessage(c.texto || "");
      setSelectedImage(null);
      setImagePreview(c.imagem || "");
      if (c.delay) setMessageDelay(c.delay);
      if (c.contatos) setSelectedContactListId(c.contatos);
    }
  }, [location.state]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      let imageUrl = imagePreview;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);

        const uploadResponse = await apiClient.post(
          API_ENDPOINTS.upload.image,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        imageUrl = uploadResponse.data.imageUrl;
      }

      let scheduledDateTime = null;
      // Define a data de envio com base na escolha do usuário
      if (isDraft) {
        // Rascunhos podem ou não ter data, mas não serão processados
        scheduledDateTime = null;
      } else if (isImmediate) {
        // Envio imediato usa a data atual
        scheduledDateTime = new Date().toISOString();
      } else if (scheduledDate && scheduledTime) {
        // --- CORREÇÃO DE FUSO HORÁRIO APLICADA AQUI ---
        // Cria a data a partir das partes numéricas para forçar a interpretação no fuso horário local do navegador.
        const dateParts = scheduledDate.split('-'); // Ex: ["2025", "09", "02"]
        const timeParts = scheduledTime.split(':'); // Ex: ["18", "00"]

        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Meses em JS são de 0 a 11
        const day = parseInt(dateParts[2]);
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        
        const localDate = new Date(year, month, day, hours, minutes);
        
        // Converte a data local para a string UTC correta, que será salva no banco
        scheduledDateTime = localDate.toISOString();
      }

      const campaignStatus = isDraft
        ? "Rascunho"
        : (isImmediate || scheduledDateTime) ? "Agendada" : "Rascunho";

      const campaignPayload = {
        name: campaignName,
        texto: message,
        imagem: imageUrl || null,
        data_de_envio: scheduledDateTime,
        contatos: selectedContactListId,
        delay: messageDelay,
        status: campaignStatus,
        device_id: selectedDevice,
        nome_da_instancia:
          devices.find((d) => d.deviceId === selectedDevice)?.connection_name ||
          user?.nome_da_instancia,
        apikey_da_instancia: user?.apikey,
      };

      await apiClient.post(API_ENDPOINTS.campaigns.create, campaignPayload);

      toast.success(
        isDraft
          ? "Rascunho salvo com sucesso!"
          : "Campanha criada e agendada com sucesso!"
      );
      navigate("/campaigns");
    } catch (err: any) {
      console.error("Error creating campaign:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Falha ao criar campanha. Tente novamente.";
      toast.error(`Erro ao criar campanha: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsDraft(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:space-x-8">
      <div className="flex-1">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/campaigns")}
                className="btn-secondary"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </button>
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Nova Campanha
              </h1>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            <div className="card">
              <h2 className="text-xl font-display font-bold text-accent mb-6">
                Configurações Básicas
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Nome da Campanha
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="input"
                    placeholder="Digite o nome da campanha"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Conexão WhatsApp
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Selecione uma conexão...</option>
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.connection_name || device.deviceId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="card">
              <h2 className="text-xl font-display font-bold text-accent mb-6">
                Mensagem
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Texto da Mensagem
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input h-32"
                    placeholder="Digite a mensagem que será enviada"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Imagem (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    className="input"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative w-fit">
                      <img
                        src={imagePreview}
                        alt="Preview da imagem"
                        className="max-h-40 rounded border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 shadow hover:bg-red-100"
                        title="Remover imagem"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-display font-bold text-accent mb-6">
                Contatos
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Lista de Contatos
                  </label>
                  <select
                    value={selectedContactListId || ""}
                    onChange={(e) => {
                      const listId = Number(e.target.value);
                      const list = contactLists.find((l) => l.id === listId);
                      setSelectedContactListId(listId);
                      if (list) setContacts(list.contatos);
                      else setContacts([]);
                    }}
                    className="input"
                    required
                  >
                    <option value="">Selecione uma lista de contatos...</option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.contatos.length} contatos)
                      </option>
                    ))}
                  </select>
                </div>
                {contacts.length > 0 && (
                  <div className="bg-primary/5 rounded-xl p-4">
                    <p className="text-sm text-accent/60 mb-2">
                      {contacts.length} contatos selecionados
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {contacts.slice(0, 5).map((contact, index) => (
                        <div key={index} className="text-sm text-accent/80">
                          {contact.name} - {contact.phone}
                        </div>
                      ))}
                      {contacts.length > 5 && (
                        <div className="text-sm text-accent/60">
                          +{contacts.length - 5} contatos
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-display font-bold text-accent mb-6">
                Agendamento
              </h2>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={isImmediate}
                      onChange={() => setIsImmediate(true)}
                      className="form-radio text-primary"
                    />
                    <span className="text-accent">Envio Imediato</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={!isImmediate}
                      onChange={() => setIsImmediate(false)}
                      className="form-radio text-primary"
                    />
                    <span className="text-accent">Agendar</span>
                  </label>
                </div>

                {!isImmediate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-accent mb-2">
                        Data
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="input"
                        required={!isImmediate}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-accent mb-2">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="input"
                        required={!isImmediate}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Intervalo entre mensagens (segundos)
                  </label>
                  <input
                    type="number"
                    value={messageDelay}
                    onChange={(e) => setMessageDelay(Number(e.target.value))}
                    className="input"
                    min="0"
                    placeholder="0"
                  />
                  <span className="text-xs text-accent/60 mt-1 block">
                    Recomendado: 60 segundos
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="btn-secondary"
              >
                Salvar Rascunho
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {isDraft ? "Salvando..." : "Criando..."}
                  </>
                ) : isDraft ? (
                  "Salvar Rascunho"
                ) : (
                  "Criar Campanha"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden md:block w-[340px] flex-shrink-0">
        <div className="sticky top-8">
          <div className="bg-[#e1f7d5] rounded-2xl border border-zinc-200 shadow-lg overflow-hidden">
            <div className="bg-[#075e54] p-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 mr-3"></div>
              <div>
                <div className="text-white font-medium">Contato Exemplo</div>
                <div className="text-[11px] text-green-100">online</div>
              </div>
            </div>

            <div className="p-4 min-h-[400px] flex flex-col justify-end">
              {(imagePreview || message) && (
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-2 self-start max-w-[280px]">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full object-cover"
                    />
                  )}
                  {message && (
                    <div className="px-4 py-2 text-sm text-zinc-800 whitespace-pre-wrap break-words">
                      {message}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[#f0f0f0] p-3 flex items-center border-t border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-zinc-300 mr-2"></div>
              <div className="text-sm text-zinc-500">Mensagem</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCampaign;
