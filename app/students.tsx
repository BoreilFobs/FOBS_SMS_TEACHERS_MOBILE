import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

interface Student {
  id: string;
  name: string;
  currentMark: number | null;
}

export default function StudentMarksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [students, setStudents] = useState<Student[]>([
    { id: "1", name: "John Doe", currentMark: null },
    { id: "2", name: "Jane Smith", currentMark: 85 },
    { id: "3", name: "Michael Johnson", currentMark: null },
    { id: "4", name: "Emily Williams", currentMark: 72 },
    { id: "5", name: "Robert Brown", currentMark: null },
  ]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [markInput, setMarkInput] = useState("");

  const handleMarkSubmit = () => {
    if (!selectedStudent) return;

    const updatedStudents = students.map((student) =>
      student.id === selectedStudent.id
        ? { ...student, currentMark: Number(markInput) }
        : student
    );

    setStudents(updatedStudents);
    setSelectedStudent(null);
    setMarkInput("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Students</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tap to enter marks
        </Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.studentCard, { backgroundColor: colors.card }]}
            onPress={() => {
              setSelectedStudent(item);
              setMarkInput(item.currentMark?.toString() || "");
            }}
          >
            <View style={styles.studentInfo}>
              <Text style={[styles.studentId, { color: colors.textSecondary }]}>
                #{item.id}
              </Text>
              <Text style={[styles.studentName, { color: colors.text }]}>
                {item.name}
              </Text>
            </View>
            <View style={styles.markContainer}>
              {item.currentMark ? (
                <Text style={[styles.markText, { color: colors.primary }]}>
                  {item.currentMark}%
                </Text>
              ) : (
                <Feather name="edit" size={18} color={colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Mark Entry Modal */}
      <Modal
        visible={!!selectedStudent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Enter Mark for {selectedStudent?.name}
            </Text>

            <TextInput
              style={[
                styles.markInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Enter mark (0-100)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={markInput}
              onChangeText={setMarkInput}
              maxLength={3}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setSelectedStudent(null)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleMarkSubmit}
                disabled={!markInput}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  studentId: {
    fontSize: 14,
    opacity: 0.7,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
  },
  markContainer: {
    minWidth: 40,
    alignItems: "flex-end",
  },
  markText: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
    gap: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  markInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
