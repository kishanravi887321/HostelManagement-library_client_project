import HostelStudent from "../../models/HostelStudent.js";

const addHostelStudent = async (req, res) => {
  try {
    const student = await HostelStudent.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getHostelStudents = async (req, res) => {
  try {
    const students = await HostelStudent.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export {
  addHostelStudent,
  getHostelStudents,
};
