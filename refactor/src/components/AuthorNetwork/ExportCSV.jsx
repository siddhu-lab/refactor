import { saveAs } from 'file-saver';
import Papa from 'papaparse';

export const exportCSV = async ({
  buildsonAuthorIdPairs,
  buildsonNoteIdPairs,
  singleNoteIdToAuthorIdsMap,
  authors,
  notes,
  getObject,
  exportOpts
}) => {
  const nameKey = exportOpts.pseudonames ? 'pseudoName' : 'firstName';

  const data = [[
    "Source_Object_id", "Source_Author_Name", "Source_Object_created", "Source_Object_type", "Source_Object_title", "Source_Note_body",
    "Target_Object_id", "Target_Author_Name", "Target_Object_created", "Target_Object_type", "Target_Object_title", "Target_Note_body"
  ]];

  const getNote = async (noteId) => {
    let note = notes.find(n => n.id === noteId || n._id === noteId);
    if (!note) {
      try {
        note = await getObject(noteId);
      } catch (e) {
        console.error("Error fetching note:", noteId, e);
      }
    }
    return note;
  };

  const plainText = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html || '';
    return tempDiv.textContent.trim() || tempDiv.innerText.trim() || '';
  };

  const formatDate = (value) => {
    const timestamp = typeof value === 'string' ? parseInt(value, 10) : value;
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? '' : date.toISOString();
  };
  

  // Paired notes
  for (let i = 0; i < buildsonAuthorIdPairs.length; i++) {
    const [sourceAuthorId, targetAuthorId] = buildsonAuthorIdPairs[i];
    const [sourceNoteId, targetNoteId] = buildsonNoteIdPairs[i];

    const sourceAuthor = authors.find(author => author.id === sourceAuthorId) || {};
    const targetAuthor = authors.find(author => author.id === targetAuthorId) || {};

    const sourceNote = await getNote(sourceNoteId);
    const targetNote = await getNote(targetNoteId);

    if (sourceNote && targetNote) {
      data.push([
        sourceNote.id || sourceNote._id || '',
        sourceAuthor[nameKey] || sourceAuthor.userName || 'Unknown',
        formatDate(sourceNote.created),
        sourceNote.type || '',
        sourceNote.title || '',
        plainText(sourceNote.data?.body),

        targetNote.id || targetNote._id || '',
        targetAuthor[nameKey] || targetAuthor.userName || 'Unknown',
        formatDate(targetNote.created),
        targetNote.type || '',
        targetNote.title || '',
        plainText(targetNote.data?.body),
      ]);
    }
  }

  // Single notes
  if (exportOpts.singleContribs) {
    for (const [noteId, authorIds] of Object.entries(singleNoteIdToAuthorIdsMap)) {
      const note = await getNote(noteId);
      if (note) {
        const author = authors.find(a => a.id === authorIds[0]) || {};
        data.push([
          note.id || note._id || '',
          author[nameKey] || author.userName || 'Unknown',
          formatDate(note.created),
          note.type || '',
          note.title || '',
          plainText(note.data?.body),
        ]);
      }
    }
  }

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'AuthorNetworkExport.csv');
};
