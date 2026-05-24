import Student from "../../models/Student.js";

const addStudent = async (req, res) => {
  try {
    const studentData = {
      ...req.body,
      identityProof: req.file ? req.file.filename : "No file uploaded"
    };

    const student = new Student(studentData);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json(err);
  }
};

const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateStudent = async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export {
  addStudent,
  getStudents,
  deleteStudent,
  updateStudent,
};
