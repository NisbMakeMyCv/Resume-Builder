with open("frontend/app/resumes/page.tsx", "r") as f:
    content = f.read()

old_handle = """  const handleOpenResume = async (doc: ResumeDocument) => {
    if (!passphrase) {
      alert("Encryption passphrase is required to decrypt this resume.");
      return;
    }
    const token = getToken();
    if (!token) return;

    setIsDownloading(true);
    try {
      const blob = await resumesApi.download(token, doc.id);
      const jsonString = await decryptData(blob, passphrase);
      setSelectedResumeJson(jsonString);
      setEditorOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to decrypt resume. Did you enter the correct passphrase?");
    } finally {
      setIsDownloading(false);
    }
  };"""

new_handle = """  const handleOpenResume = async (doc: ResumeDocument) => {
    const isEncrypted = !doc.file_name || doc.file_name.endsWith(".enc");

    if (isEncrypted && !passphrase) {
      alert("Encryption passphrase is required to decrypt this resume.");
      return;
    }
    
    const token = getToken();
    if (!token) return;

    setIsDownloading(true);
    try {
      const blob = await resumesApi.download(token, doc.id);
      
      if (!isEncrypted) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.file_name || `resume-${doc.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const jsonString = await decryptData(blob, passphrase!);
        setSelectedResumeJson(jsonString);
        setEditorOpen(true);
      }
    } catch (err) {
      console.error(err);
      if (isEncrypted) {
        alert("Failed to decrypt resume. Did you enter the correct passphrase?");
      } else {
        alert("Failed to download file.");
      }
    } finally {
      setIsDownloading(false);
    }
  };"""

content = content.replace(old_handle, new_handle)

# Let's also update the label dynamically
old_label = """{/* Cloud Lock Indicator */}
                        <div className="absolute top-4 left-4 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-green-500/20 z-10 shadow-sm">
                          <MaterialIcon name="lock" className="text-[12px]" />
                          Encrypted
                        </div>"""

new_label = """{/* Type Indicator */}
                        <div className={`absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border z-10 shadow-sm ${
                          (!doc.file_name || doc.file_name.endsWith(".enc"))
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        }`}>
                          <MaterialIcon name={(!doc.file_name || doc.file_name.endsWith(".enc")) ? "lock" : "description"} className="text-[12px]" />
                          {(!doc.file_name || doc.file_name.endsWith(".enc")) ? "Encrypted Vault" : doc.file_name.split('.').pop()?.toUpperCase()}
                        </div>"""

content = content.replace(old_label, new_label)

with open("frontend/app/resumes/page.tsx", "w") as f:
    f.write(content)
