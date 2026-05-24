import Library from "../../models/Library.js";

const addLibraryStudent = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const inputPaid = Number(req.body.amountPaid) || 0;
    const inputDue = Number(req.body.amountDue) || 0;

    let finalAmountPaid = inputPaid;
    let finalAmountDue = inputDue;
    let finalAdvanceBalance = 0;

    if (inputPaid > 0 && inputDue < 0) {
      finalAdvanceBalance = Math.abs(inputDue);
      finalAmountDue = 0;
    } else if (req.body.isAdvancePayment === "true" || req.body.isAdvancePayment === true) {
      finalAdvanceBalance = inputPaid;
      finalAmountPaid = 0;
      finalAmountDue = 0;
    }

    const studentData = {
      ...req.body,
      amountPaid: finalAmountPaid,
      amountDue: finalAmountDue,
      advanceBalance: finalAdvanceBalance,
      feeStatus: finalAmountDue > 0 ? "Pending" : "Paid"
    };

    if (req.file) {
      studentData.identityProof = req.file.filename;
    }

    const data = new Library(studentData);
    await data.save();

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const getLibraryStudents = async (req, res) => {
  try {
    const data = await Library.find();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateLibraryStudent = async (req, res) => {
  try {
    const updated = await Library.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const deleteLibraryStudent = async (req, res) => {
  try {
    const deleted = await Library.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Student record not found" });
    }

    res.json({ message: "Student deleted successfully", deleted });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export {
  addLibraryStudent,
  getLibraryStudents,
  updateLibraryStudent,
  deleteLibraryStudent,
};
