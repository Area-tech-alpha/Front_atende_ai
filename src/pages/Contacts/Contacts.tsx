import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Upload,
  Download,
  Search,
  User,
  Loader2,
  X,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/config/api";
import apiClient from "@/lib/api.client";
import ConfirmToast from "@/components/ui/ConfirmToast";

interface Contact {
  name: string;
  phone: string;
}

interface ContactList {
  id: number;
  name: string;
  contatos: Contact[];
  created_at: string;
}

const ContactsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "add" | "import" | "export" | "edit" | null
  >(null);
  const [newContacts, setNewContacts] = useState<Contact[]>([
    { name: "", phone: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importListName, setImportListName] = useState("");
  const [importContacts, setImportContacts] = useState<Contact[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [exportListId, setExportListId] = useState<number | null>(null);
  const [editingList, setEditingList] = useState<ContactList | null>(null);

  const fetchContactLists = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.contacts.list);
      const formattedLists = response.data.map((list: any) => ({
        id: list.id,
        name:
          list.name ||
          `Lista de ${new Date(list.created_at).toLocaleDateString()}`,
        contatos: JSON.parse(list.contatos || "[]"),
        created_at: list.created_at,
      }));
      setContactLists(formattedLists);
    } catch (error) {
      toast.error("Erro ao buscar listas de contatos.");
      console.error("Error fetching contact lists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchContactLists();
    }
  }, [user]);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").slice(1);
      const parsedContacts: Contact[] = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [name, phone] = line.split(",").map((item) => item.trim());
          return { name, phone };
        });
      setImportContacts(parsedContacts);
    };
    reader.readAsText(file);
  };

  const handleSaveImportedList = async () => {
    if (!importListName || importContacts.length === 0) {
      toast.warn("Nome da lista e contatos são obrigatórios.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: importListName,
        contatos: importContacts,
      };
      await apiClient.post(API_ENDPOINTS.contacts.create, payload);
      toast.success(`Lista "${importListName}" importada com sucesso!`);
      closeModal();
      fetchContactLists();
    } catch (err) {
      toast.error("Erro ao importar lista.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    const listName = prompt("Qual o nome desta nova lista de contatos?");
    if (!listName) {
      toast.error("O nome da lista é obrigatório para salvar.");
      return;
    }

    const validContacts = newContacts.filter((c) => c.name && c.phone);
    if (validContacts.length === 0) {
      toast.warn("Adicione pelo menos um contato válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: listName,
        contatos: validContacts,
      };
      await apiClient.post(API_ENDPOINTS.contacts.create, payload);
      toast.success("Lista de contatos criada com sucesso!");
      closeModal();
      fetchContactLists();
    } catch (err) {
      toast.error("Erro ao criar lista de contatos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList) return;

    const validContacts = editingList.contatos.filter((c) => c.name && c.phone);
    if (validContacts.length === 0) {
      toast.warn("Adicione pelo menos um contato válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: editingList.name,
        contatos: validContacts,
      };
      await apiClient.put(API_ENDPOINTS.contacts.edit(editingList.id), payload);
      toast.success("Lista de contatos atualizada com sucesso!");
      closeModal();
      fetchContactLists();
    } catch (err) {
      toast.error("Erro ao atualizar lista de contatos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteList = async (listId: number) => {
    toast.warn(
      ({ closeToast }) => (
        <ConfirmToast
          message="Tem certeza que deseja excluir esta lista?"
          onConfirm={async () => {
            try {
              await apiClient.delete(
                API_ENDPOINTS.contacts.delete(String(listId))
              );
              toast.success("Lista excluída!");
              setContactLists((prev) => prev.filter((l) => l.id !== listId));
            } catch (error) {
              toast.error("Erro ao excluir lista.");
            }
          }}
          onCancel={() => {}}
          closeToast={closeToast}
        />
      ),
      {
        autoClose: false,
        closeOnClick: false,
      }
    );
  };

  const handleExportList = () => {
    if (!exportListId) return;
    const listToExport = contactLists.find((l) => l.id === exportListId);
    if (!listToExport) {
      toast.error("Lista não encontrada.");
      return;
    }
    const csvHeader = "name,phone\n";
    const csvRows = listToExport.contatos
      .map((c) => `${c.name},${c.phone}`)
      .join("\n");
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${listToExport.name.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closeModal();
  };

  const filteredLists = contactLists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.contatos.some(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
      )
  );

  const openModal = (
    type: "add" | "import" | "export" | "edit",
    list?: ContactList
  ) => {
    setModalType(type);
    if (type === "edit" && list) {
      setEditingList(list);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setNewContacts([{ name: "", phone: "" }]);
    setImportContacts([]);
    setImportListName("");
    setCsvFileName("");
    setExportListId(null);
    setEditingList(null);
  };

  const handleAddContactField = () => {
    setNewContacts([...newContacts, { name: "", phone: "" }]);
  };

  const handleRemoveContactField = (index: number) => {
    const list = [...newContacts];
    list.splice(index, 1);
    setNewContacts(list);
  };

  const handleNewContactChange = (
    index: number,
    field: keyof Contact,
    value: string
  ) => {
    const list = [...newContacts];
    list[index][field] = value;
    setNewContacts(list);
  };

  const handleEditingContactChange = (
    index: number,
    field: keyof Contact,
    value: string
  ) => {
    if (!editingList) return;
    const list = [...editingList.contatos];
    list[index][field] = value;
    setEditingList({ ...editingList, contatos: list });
  };

  const handleAddEditingContactField = () => {
    if (!editingList) return;
    setEditingList({
      ...editingList,
      contatos: [...editingList.contatos, { name: "", phone: "" }],
    });
  };

  const handleRemoveEditingContactField = (index: number) => {
    if (!editingList) return;
    const list = [...editingList.contatos];
    list.splice(index, 1);
    setEditingList({ ...editingList, contatos: list });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent">Contatos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => openModal("import")}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={16} /> Importar
          </button>
          <button
            onClick={() => openModal("add")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Novo Contato
          </button>
        </div>
      </div>

      <div className="card">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-accent/60"
          />
          <input
            type="text"
            placeholder="Buscar por nome da lista, nome do contato ou telefone..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLists.map((list) => (
          <div key={list.id} className="card flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-accent pr-2">{list.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal("edit", list)}
                    className="text-accent/60 hover:text-primary transition-colors"
                    title="Editar lista"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="text-accent/60 hover:text-red-500 transition-colors"
                    title="Excluir lista"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {list.contatos.slice(0, 3).map((contact, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-secondary-dark rounded-lg flex items-center justify-center ring--secondary-darker">
                      <User size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-accent font-medium truncate">
                        {contact.name}
                      </p>
                      <p className="text-accent/60 truncate">{contact.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border text-sm text-accent/60">
              {list.contatos.length > 3 && (
                <p>+{list.contatos.length - 3} outros contatos</p>
              )}
              <p>{list.contatos.length} contato(s) no total</p>
              <button
                onClick={() => {
                  setExportListId(list.id);
                  openModal("export");
                }}
                className="btn-secondary mt-2 w-full flex justify-center items-center gap-2"
              >
                <Download size={16} /> Exportar Lista
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-accent/60 hover:text-primary"
            >
              <X size={24} />
            </button>
            {modalType === "add" && (
              <form onSubmit={handleManualAddList} className="space-y-6">
                <h2 className="text-xl font-bold text-accent">
                  Adicionar Contatos
                </h2>
                {newContacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium text-accent/60 mb-1">
                        Nome
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={contact.name}
                        onChange={(e) =>
                          handleNewContactChange(index, "name", e.target.value)
                        }
                        placeholder="Nome do Contato"
                        required
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium text-accent/60 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        className="input"
                        value={contact.phone}
                        onChange={(e) =>
                          handleNewContactChange(index, "phone", e.target.value)
                        }
                        placeholder="Ex: 5511988887777"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveContactField(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remover contato"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddContactField}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Adicionar outro contato
                </button>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Criar Lista"
                    )}
                  </button>
                </div>
              </form>
            )}
            {modalType === "edit" && editingList && (
              <form onSubmit={handleEditList} className="space-y-6">
                <h2 className="text-xl font-bold text-accent">
                  Editar Lista: {editingList.name}
                </h2>
                <div className="flex-1 space-y-2">
                  <label className="block text-sm font-medium text-accent/60 mb-1">
                    Nome da Lista
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editingList.name}
                    onChange={(e) =>
                      setEditingList({ ...editingList, name: e.target.value })
                    }
                    required
                  />
                </div>
                {editingList.contatos.map((contact, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium text-accent/60 mb-1">
                        Nome
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={contact.name}
                        onChange={(e) =>
                          handleEditingContactChange(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Nome do Contato"
                        required
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium text-accent/60 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        className="input"
                        value={contact.phone}
                        onChange={(e) =>
                          handleEditingContactChange(
                            index,
                            "phone",
                            e.target.value
                          )
                        }
                        placeholder="Ex: 5511988887777"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEditingContactField(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remover contato"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddEditingContactField}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Adicionar outro contato
                </button>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Salvar Alterações"
                    )}
                  </button>
                </div>
              </form>
            )}
            {modalType === "import" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-accent">
                  Importar Lista de Contatos
                </h2>
                <div>
                  <label className="block text-sm font-medium text-accent/60 mb-1">
                    Nome da Nova Lista
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={importListName}
                    onChange={(e) => setImportListName(e.target.value)}
                    placeholder="Ex: Clientes VIP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent/60 mb-1">
                    Arquivo CSV
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Upload className="h-10 w-10 text-accent/60 mx-auto mb-2" />
                    <p className="text-sm text-accent/60">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-semibold text-primary hover:underline"
                      >
                        Clique para enviar
                      </button>
                    </p>
                    {csvFileName && (
                      <p className="text-xs text-green-500 mt-2">
                        Arquivo: {csvFileName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveImportedList}
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Importar Lista"
                    )}
                  </button>
                </div>
              </div>
            )}{" "}
            {modalType === "export" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-accent">
                  Exportar Lista de Contatos
                </h2>
                <div>
                  <label className="block text-sm font-medium text-accent/60 mb-1">
                    Selecione a Lista para Exportar
                  </label>
                  <select
                    className="input"
                    value={exportListId || ""}
                    onChange={(e) => setExportListId(Number(e.target.value))}
                  >
                    <option value="" disabled>
                      -- Escolha uma lista --
                    </option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button
                    onClick={handleExportList}
                    disabled={!exportListId}
                    className="btn-primary"
                  >
                    Exportar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
