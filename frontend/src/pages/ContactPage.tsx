import { useState, useRef } from "react";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client";

const MAX_FILE_SIZE = 1_000_000; // 1 MB
const MAX_FILES = 3;

export default function ContactPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const added: File[] = [];
    for (const f of Array.from(newFiles)) {
      if (files.length + added.length >= MAX_FILES) {
        setError(`Maximum ${MAX_FILES} fichiers`);
        break;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`« ${f.name} » dépasse 1 Mo`);
        continue;
      }
      added.push(f);
    }
    if (added.length) setFiles((prev) => [...prev, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      files.forEach((f) => formData.append("files", f));
      await api.post("/contact/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSent(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || "Erreur lors de l'envoi du message";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Message envoyé
        </h2>
        <p className="text-gray-400">
          Nous avons bien reçu votre message et vous répondrons dans les
          meilleurs délais.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setSubject("");
            setMessage("");
            setFiles([]);
          }}
          className="mt-6 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors cursor-pointer"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Contact</h1>
      <p className="text-gray-400 mb-8">
        Une question, un problème ou une suggestion ? Écrivez-nous.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Subject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Sujet
          </label>
          <input
            id="subject"
            type="text"
            required
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex : Problème de connexion au tunnel"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Message
          </label>
          <textarea
            id="message"
            required
            maxLength={5000}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre demande..."
            className="w-full px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Files */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Pièces jointes{" "}
            <span className="text-gray-500 font-normal">
              (max {MAX_FILES} fichiers, 1 Mo chacun)
            </span>
          </label>

          {files.length > 0 && (
            <div className="space-y-2 mb-3">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/30"
                >
                  <PaperClipIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {f.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(f.size / 1024).toFixed(0)} Ko
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <PaperClipIcon className="w-4 h-4" />
              Ajouter un fichier
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={sending || !subject.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
              Envoi en cours...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="w-5 h-5" />
              Envoyer
            </>
          )}
        </button>
      </form>
    </div>
  );
}
