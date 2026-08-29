import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { fulltoast } from 'fulltoast';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Field, palette, PrimaryButton, ProgressBar, Ring, Sheet } from '@/components/ChecksUI';
import { getBalance, useChecks } from '@/lib/checks-store';

const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
export default function HomeScreen() {
  const { activeGoal, checklists, addChecklist, renameChecklist, toggleTask, addTask } = useChecks();
  const [newListOpen, setNewListOpen] = useState(false), [listTitle, setListTitle] = useState('');
  const [taskList, setTaskList] = useState<string | null>(null), [taskTitle, setTaskTitle] = useState('');
  const [editingList, setEditingList] = useState<string | null>(null), [editedTitle, setEditedTitle] = useState('');
  const balance = activeGoal ? getBalance(activeGoal) : 0, progress = activeGoal ? balance / activeGoal.target : 0;
  async function importMarkdown() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/markdown', 'text/plain'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];

    try {
      await fulltoast.promise(async () => {
        const content = await new File(asset.uri).text();
        const tasks = content
          .split(/\r?\n/)
          .map((line) => line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/))
          .filter(Boolean)
          .map((match) => ({ done: match![1].toLowerCase() === 'x', title: match![2].trim() }));
        if (!tasks.length) throw new Error('No checklist items');
        const name = asset.name.replace(/\.md$/i, '');
        addChecklist(name, tasks);
        return { count: tasks.length, name };
      }, {
        loading: { title: 'Importando checklist', description: `Leyendo ${asset.name}…` },
        success: ({ count, name }) => ({ title: 'Checklist importada', description: `${name} · ${count} tareas`, duration: 3500 }),
        error: { title: 'No se pudo importar', description: 'El archivo debe contener tareas con el formato - [ ] Tarea.', duration: 5000 },
        position: 'top-center',
      });
    } catch {
      // FullToast already presents the user-facing error state.
    }
  }
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>CHECKS</Text><Text style={styles.title}>Tu panorama</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>BC</Text></View></View>
    {activeGoal ? <Card style={styles.hero}><View style={styles.heroTop}><View style={{ flex: 1 }}><Text style={styles.label}>OBJETIVO PRINCIPAL</Text><Text style={styles.goalTitle}>{activeGoal.title}</Text><Text style={styles.amount}>{money(balance)} <Text style={styles.target}>/ {money(activeGoal.target)}</Text></Text></View><Ring value={progress} label={`${Math.round(progress * 100)}%`} /></View><ProgressBar value={progress} /><View style={styles.metrics}><View><Text style={styles.metricLabel}>Faltan</Text><Text style={styles.metricValue}>{money(Math.max(activeGoal.target - balance, 0))}</Text></View><View><Text style={styles.metricLabel}>Movimientos</Text><Text style={styles.metricValue}>{activeGoal.movements.length}</Text></View></View></Card> : <Card><Text style={styles.emptyIcon}>◎</Text><Text style={styles.emptyTitle}>Aún no hay un objetivo</Text><Text style={styles.emptyText}>Ve a Progreso para crear tu primera meta monetaria y verla crecer aquí.</Text></Card>}
    <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Mis checklists</Text><Text style={styles.sectionSub}>{checklists.length ? `${checklists.length} listas activas` : 'Organiza los pasos de tu objetivo'}</Text></View><Pressable style={styles.addRound} onPress={() => setNewListOpen(true)}><Text style={styles.addRoundText}>＋</Text></Pressable></View>
    {!checklists.length && <Card style={styles.emptyCard}><Text style={styles.emptyIcon}>✓</Text><Text style={styles.emptyTitle}>Convierte planes en acciones</Text><Text style={styles.emptyText}>Crea una lista o importa tareas desde un archivo Markdown.</Text><Pressable style={styles.outline} onPress={importMarkdown}><Text style={styles.outlineText}>⇧  Importar Markdown</Text></Pressable></Card>}
    {checklists.map((list) => { const done = list.tasks.filter((task) => task.done).length, ratio = list.tasks.length ? done / list.tasks.length : 0; return <Card key={list.id} style={styles.listCard}><View style={styles.listHead}><View style={{ flex: 1 }}><Pressable hitSlop={8} onPress={() => { setEditingList(list.id); setEditedTitle(list.title); }} accessibilityRole="button" accessibilityLabel={`Editar nombre de ${list.title}`}><Text style={styles.listTitle}>{list.title}</Text></Pressable><Text style={styles.listMeta}>{done} de {list.tasks.length} completadas</Text></View><Text style={styles.percent}>{Math.round(ratio * 100)}%</Text></View><ProgressBar value={ratio} color={palette.purple} /><View style={styles.tasks}>{list.tasks.map((task) => <Pressable key={task.id} style={styles.task} onPress={() => toggleTask(list.id, task.id)}><View style={[styles.check, task.done && styles.checked]}><Text style={styles.checkText}>{task.done ? '✓' : ''}</Text></View><Text style={[styles.taskText, task.done && styles.taskDone]}>{task.title}</Text></Pressable>)}</View><Pressable onPress={() => setTaskList(list.id)}><Text style={styles.addTask}>＋ Agregar tarea</Text></Pressable></Card>; })}
    {!!checklists.length && <Pressable style={styles.importLink} onPress={importMarkdown}><Text style={styles.outlineText}>⇧  Importar otra lista Markdown</Text></Pressable>}
  </ScrollView><Sheet visible={newListOpen} title="Nueva checklist" onClose={() => setNewListOpen(false)}><Field placeholder="Nombre de la lista" value={listTitle} onChangeText={setListTitle} /><PrimaryButton label="Crear lista" disabled={!listTitle.trim()} onPress={() => { const name = listTitle.trim(); addChecklist(name, []); setListTitle(''); setNewListOpen(false); fulltoast.success({ title: 'Checklist creada', description: name }); }} /></Sheet><Sheet visible={!!editingList} title="Editar nombre" onClose={() => setEditingList(null)}><Field placeholder="Nombre de la lista" value={editedTitle} onChangeText={setEditedTitle} autoFocus selectTextOnFocus /><PrimaryButton label="Guardar cambios" disabled={!editedTitle.trim()} onPress={() => { if (editingList) renameChecklist(editingList, editedTitle.trim()); setEditingList(null); setEditedTitle(''); fulltoast.success({ title: 'Nombre actualizado' }); }} /></Sheet><Sheet visible={!!taskList} title="Agregar tarea" onClose={() => setTaskList(null)}><Field placeholder="¿Qué necesitas hacer?" value={taskTitle} onChangeText={setTaskTitle} /><PrimaryButton label="Agregar" disabled={!taskTitle.trim()} onPress={() => { if (taskList) addTask(taskList, taskTitle.trim()); setTaskTitle(''); setTaskList(null); fulltoast.success({ title: 'Tarea agregada' }); }} /></Sheet></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: palette.bg }, content: { padding: 20, paddingBottom: 120, gap: 18 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, eyebrow: { color: palette.lime, fontSize: 11, fontWeight: '900', letterSpacing: 2 }, title: { color: palette.text, fontSize: 30, fontWeight: '900', marginTop: 4 }, avatar: { width: 46, height: 46, borderRadius: 18, backgroundColor: palette.purple, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: 'white', fontWeight: '900' }, hero: { padding: 22 }, heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, label: { color: palette.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, goalTitle: { color: palette.text, fontSize: 20, fontWeight: '800', marginTop: 7 }, amount: { color: palette.text, fontSize: 26, fontWeight: '900', marginTop: 16 }, target: { color: palette.muted, fontSize: 15, fontWeight: '600' }, metrics: { flexDirection: 'row', gap: 54, marginTop: 18 }, metricLabel: { color: palette.muted, fontSize: 12 }, metricValue: { color: palette.text, fontWeight: '800', fontSize: 15, marginTop: 3 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, sectionTitle: { color: palette.text, fontSize: 22, fontWeight: '900' }, sectionSub: { color: palette.muted, fontSize: 13, marginTop: 4 }, addRound: { width: 42, height: 42, backgroundColor: palette.panel2, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, addRoundText: { color: palette.text, fontSize: 23 }, emptyCard: { alignItems: 'center', paddingVertical: 28 }, emptyIcon: { color: palette.lime, fontSize: 35, fontWeight: '300' }, emptyTitle: { color: palette.text, fontSize: 19, fontWeight: '800', marginTop: 10 }, emptyText: { color: palette.muted, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 290 }, outline: { borderWidth: 1, borderColor: '#3A424F', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, marginTop: 20 }, outlineText: { color: palette.text, fontWeight: '700' }, listCard: { gap: 15 }, listHead: { flexDirection: 'row', alignItems: 'center' }, listTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, listTitle: { color: palette.text, fontSize: 19, fontWeight: '800', flexShrink: 1 }, editButton: { color: palette.muted, fontSize: 20, paddingHorizontal: 3 }, listMeta: { color: palette.muted, marginTop: 4 }, percent: { color: palette.purple, fontWeight: '900', fontSize: 18 }, tasks: { gap: 5, marginTop: 3 }, task: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }, check: { width: 25, height: 25, borderRadius: 9, borderWidth: 1.5, borderColor: '#505866', alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: palette.purple, borderColor: palette.purple }, checkText: { color: 'white', fontWeight: '900' }, taskText: { color: palette.text, fontSize: 15, flex: 1 }, taskDone: { color: palette.muted, textDecorationLine: 'line-through' }, addTask: { color: palette.lime, fontWeight: '800', paddingTop: 5 }, importLink: { alignItems: 'center', padding: 12 } });
