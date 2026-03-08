import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';
import useApiService from "../../../services/useApiService"; // Sử dụng hook mới
import { ApiResponse, UserStatus, Rank, Subject } from "../../../interfaces";
import "./SettingForm.css";
// Định nghĩa kiểu dữ liệu cho trạng thái người dùng

const Setting: React.FC = () => {
  const { get, post, put, del } = useApiService(); // Sử dụng các phương thức từ useApiService

  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);

  const [newStatus, setNewStatus] = useState("");
  const [newRanks, setnewRanks] = useState("");

  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingRankId, setEditingRankId] = useState<number | null>(null);

  const [editingNameStatus, setEditingNameStatus] = useState("");
  const [editingNameRank, setEditingNameRank] = useState("");
  const [selectedRank, setSelectedRank] = useState<any>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectNumberOfQuestions, setNewSubjectNumberOfQuestions] = useState(10);  // Số câu hỏi mới
  const [newSubjectThreshold, setNewSubjectThreshold] = useState(5);
  const [newSubjectNameEx, setNewSubjectNameEx] = useState("");
  const [newTimeFinish, setNewTimeFinish] = useState(6);

  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [editingSubjectNumberOfQuestions, setEditingSubjectNumberOfQuestions] = useState(10); // Số câu hỏi chỉnh sửa
  const [editingSubjectThreshold, setEditingSubjectThreshold] = useState(5);
  const [editingSubjectNameEx, setEditingSubjectNameEx] = useState("");
  const [newSubjectShowSubject, setNewSubjectShowSubject] = useState<boolean>(true); // Mặc định là true
  const [editingSubjectShowSubject, setEditingSubjectShowSubject] = useState<boolean>(true); // Mặc định là true khi chỉnh sửa
  const [editingTimeFinish, setEditingTimeFinish] = useState(6);


  // Lấy danh sách trạng thái khi component mount
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const responseGetStatus = await get<ApiResponse<UserStatus[]>>("/api/status");
        setUserStatuses(responseGetStatus.DT);

        const responseGetRanks = await get<ApiResponse<Rank[]>>("/api/rank/getRank");
        setRanks(responseGetRanks.DT);

        if (responseGetRanks.DT.length) {
          setSelectedRank(responseGetRanks.DT[0].id)
        }

      } catch (error) {
        console.error("Error fetching user statuses:", error);
        alert("Không thể tải dữ liệu user status.");
      }
    };

    fetchStatuses();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [selectedRank]);

  const fetchSubjects = async () => {
    try {
      if (selectedRank !== null) {
        const response = await get<ApiResponse<Subject[]>>(`/api/subject/${selectedRank}/get-subjects`);
        setSubjects(response.DT);
      }
    } catch (error) {
      console.error("Error fetching subjects for rank:", error);
    }
  }
  // Thêm trạng thái mới
  const handleCreateStatus = async () => {
    if (!newStatus.trim()) {
      alert("Tên trạng thái không được để trống.");
      return;
    }
    try {
      await post("/api/status", { namestatus: newStatus });
      setNewStatus("");
      const updatedStatuses = await get<ApiResponse<UserStatus[]>>("/api/status");
      setUserStatuses(updatedStatuses.DT);
    } catch (error) {
      console.error("Error creating user status:", error);
      alert("Lỗi khi tạo user status.");
    }
  };

  // Cập nhật trạng thái
  const handleUpdateStatus = async (id: number) => {
    if (!editingNameStatus.trim()) {
      alert("Tên trạng thái không được để trống.");
      return;
    }
    try {
      await put(`/api/status/${id}`, { namestatus: editingNameStatus });
      setEditingStatusId(null);
      setEditingNameStatus("");
      const updatedStatuses = await get<ApiResponse<UserStatus[]>>("/api/status");
      setUserStatuses(updatedStatuses.DT);
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Lỗi khi cập nhật user status.");
    }
  };

  // Xóa trạng thái
  const handleDeleteStatus = async (id: number) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa trạng thái này?");
    if (!confirmDelete) return;

    try {
      // await del(`/api/status/${id}`);
      // const updatedStatuses = await get<ApiResponse>("/api/status");
      // setUserStatuses(updatedStatuses.DT);
    } catch (error) {
      console.error("Error deleting user status:", error);
      alert("Lỗi khi xóa user status.");
    }
  };

  /////rankkkkkkk
  // Thêm trạng thái mới
  const handleCreateRank = async () => {
    if (!newRanks.trim()) {
      alert("Tên trạng thái không được để trống.");
      return;
    }
    try {
      await post("/api/rank/create-rank", { name: newRanks });
      setnewRanks("");
      const getRanks = await get<ApiResponse<Rank[]>>("/api/rank/getRank");
      setRanks(getRanks.DT);
    } catch (error) {
      console.error("Error creating user rank/create-rank:", error);
      alert("Lỗi khi tạo user rank/create-rank.");
    }
  };

  // Cập nhật trạng thái
  const handleUpdateRank = async (id: number) => {
    if (!editingNameRank.trim()) {
      alert("Tên hạng không được để trống.");
      return;
    }
    try {
      await put(`/api/rank/update-rank/${id}`, { name: editingNameRank });
      setEditingRankId(null);
      setEditingNameRank("");
      const getRanks = await get<ApiResponse<Rank[]>>("/api/rank/getRank");
      setRanks(getRanks.DT);
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Lỗi khi cập nhật user status.");
    }
  };

  // Xóa trạng thái
  const handleDeleteRank = async (id: number) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa trạng thái này?");
    if (!confirmDelete) return;

    try {
      // await del(`/api/status/${id}`);
      // const updatedStatuses = await get<ApiResponse>("/api/status");
      // setUserStatuses(updatedStatuses.DT);
    } catch (error) {
      console.error("Error deleting user status:", error);
      alert("Lỗi khi xóa user status.");
    }
  };

  const handleRankChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRank(Number(event.target.value));
    console.log('check  selectedrank', selectedRank)
  };

  // Thêm môn học
  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      alert("Tên môn học không được để trống.");
      return;
    }
    if (!newSubjectNameEx.trim()) {
      alert("Tên môn học trong Excel Sheet không được để trống.");
      return;
    }
    try {
      await post("/api/subject/create-subject", {
        rankId: selectedRank,
        name: newSubjectName,
        threshold: newSubjectThreshold,
        nameEx: newSubjectNameEx,
        numberofquestion: newSubjectNumberOfQuestions,
        showsubject: newSubjectShowSubject,
        timeFinish: newTimeFinish
      });
      setNewSubjectName("");
      setNewSubjectNameEx("");
      setNewSubjectThreshold(5);
      setEditingSubjectNumberOfQuestions(10);
      setEditingSubjectShowSubject(true)
      setEditingTimeFinish(6);
      // Fetch lại danh sách môn học
      await fetchSubjects()
    } catch (error) {
      console.error("Error creating subject:", error);
      alert("Lỗi khi tạo môn học.");
    }
  };


  // Cập nhật môn học
  const handleUpdateSubject = async (id: number) => {
    if (!editingSubjectName.trim() || !editingSubjectNameEx.trim() || editingSubjectThreshold < 5 || editingSubjectNumberOfQuestions < 10) {
      alert("Có trường không hợp lệ");
      return;
    }

    try {
      await put(`/api/subject/update-subject/${id}`, {
        name: editingSubjectName,
        threshold: editingSubjectThreshold,
        // numberofquestion: editingSubjectNumberOfQuestions, // Cập nhật số lượng câu hỏi
        showsubject: editingSubjectShowSubject,
        nameEx: editingSubjectNameEx,
        timeFinish: editingTimeFinish
      });
      setEditingSubjectId(null);
      setEditingSubjectName("");
      setEditingSubjectNameEx("");
      setEditingSubjectThreshold(5);
      setEditingTimeFinish(6);
      setEditingSubjectNumberOfQuestions(10); // Reset số lượng câu hỏi về 10
      setEditingSubjectShowSubject(true)
      // Fetch lại danh sách môn học
      await fetchSubjects()
    } catch (error) {
      console.error("Error updating subject:", error);
      alert("Lỗi khi cập nhật môn học.");
    }
  };

  return (
    <div className="setting-form">
      {/* quản lý stt */}
      <div className="child">
        <div className="user-status-container">
          <h2>Quản lý trạng thái người dùng</h2>

          <div className="form-group">
            <input
              type="text"
              placeholder="Nhập tên trạng thái mới"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            />
            <button onClick={handleCreateStatus}>Thêm trạng thái</button>
          </div>
          <table className="status-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {userStatuses.map((status) => (
                <tr key={status.id}>
                  <td>{status.id}</td>
                  <td>
                    {editingStatusId === status.id ? (
                      <input
                        type="text"
                        value={editingNameStatus}
                        onChange={(e) => setEditingNameStatus(e.target.value)}
                      />
                    ) : (
                      status.namestatus
                    )}
                  </td>
                  <td>
                    {editingStatusId === status.id ? (
                      <>
                        <button onClick={() => handleUpdateStatus(status.id)}>Lưu</button>
                        <button onClick={() => setEditingStatusId(null)}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingStatusId(status.id);
                            setEditingNameStatus(status.namestatus);
                          }}
                        >
                          Sửa
                        </button>
                        <button onClick={() => handleDeleteStatus(status.id)}>Xóa</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* quản lý hạng */}
        <div className="user-status-container">
          <h2>Quản lý Hạng GPLX</h2>

          <div className="form-group">
            <input
              type="text"
              placeholder="Nhập tên tên hạng xe mới"
              value={newRanks}
              onChange={(e) => setnewRanks(e.target.value)}
            />
            <button onClick={handleCreateRank}>Thêm Hạng</button>
          </div>
          <table className="status-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên hạng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((rank) => (
                <tr key={rank.id}>
                  <td>{rank.id}</td>
                  <td>
                    {editingRankId === rank.id ? (
                      <input
                        type="text"
                        value={editingNameRank}
                        onChange={(e) => setEditingNameRank(e.target.value)}
                      />
                    ) : (
                      rank.name
                    )}
                  </td>
                  <td>
                    {editingRankId === rank.id ? (
                      <>
                        <button onClick={() => handleUpdateRank(rank.id)}>Lưu</button>
                        <button onClick={() => setEditingRankId(null)}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingRankId(rank.id);
                            setEditingNameRank(rank.name)
                          }}
                        >
                          Sửa
                        </button>
                        <button onClick={() => handleDeleteRank(rank.id)}>Xóa</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="child">
        {/* quản lý môn họcc*/}
        <div className="add-subject">
          <h2>Thêm môn học theo hạng</h2>

          <div className="select-course-child">
            <label>Chọn Hạng:</label>
            <select value={selectedRank || ""} onChange={handleRankChange}>
              <option value="" disabled>
                -- Chọn Hạng --
              </option>
              {ranks.map((rank) => (
                <option key={rank.id} value={rank.id}>
                  {rank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Form thêm môn học */}
          <div className="form-group form-group-rank">
            <div className="rank-child">
              <label htmlFor="">Nhập tên môn học: </label>
              <input
                type="text"
                placeholder="Nhập tên môn học mới"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>

            <div className="rank-child">
              <label htmlFor="">Số lượng câu hỏi *Khớp với số câu hỏi trong Excel: </label>
              <input
                type="number"
                placeholder="Số câu hỏi"
                value={newSubjectNumberOfQuestions}
                onChange={(e) => setNewSubjectNumberOfQuestions(Number(e.target.value))}
              />
            </div>
            <div className="rank-child">
              <label htmlFor="">Điểm chuẩn để qua môn: </label>
              <input
                type="number"
                placeholder="Điểm chuẩn"
                value={newSubjectThreshold}
                onChange={(e) => setNewSubjectThreshold(Number(e.target.value))}
              />
            </div>

            <div className="rank-child">
              <label htmlFor="">Thời gian thi tính bằng phút: </label>
              <input
                type="number"
                placeholder="Thời gian thi"
                value={newTimeFinish}
                onChange={(e) => setNewTimeFinish(Number(e.target.value))}
              />
            </div>

            <div className="rank-child">
              <label htmlFor="">Nhập tên môn học *khớp với tên Sheet trong Excel: </label>
              <input
                type="text"
                placeholder="Tên Sheet môn học phải chuẩn mới có thể import bộ đề vào thành công"
                value={newSubjectNameEx}
                onChange={(e) => setNewSubjectNameEx(e.target.value)}
              />
            </div>

            <div className="rank-child">
              <label>Hiển thị môn học:</label>
              <div>
                <input
                  type="radio"
                  id="show"
                  name="showsubject"
                  value="true"
                  checked={newSubjectShowSubject === true}
                  onChange={() => setNewSubjectShowSubject(true)} // Chỉ set giá trị là true khi nhấn vào 'Hiển thị'
                />
                <label htmlFor="show">Show</label>

                <input
                  type="radio"
                  id="hide"
                  name="showsubject"
                  value="false"
                  checked={newSubjectShowSubject === false}
                  onChange={() => setNewSubjectShowSubject(false)} // Chỉ set giá trị là false khi nhấn vào 'Không hiển thị'
                />
                <label htmlFor="hide">Unshow</label>
              </div>
            </div>

            <button onClick={handleCreateSubject}>Thêm Môn học</button>
          </div>

        </div>
        <div className="table-subject">
          <h2>Quản lý Môn học theo từng hạng</h2>
          <table className="status-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên môn học</th>
                <th>Số lượng câu hỏi</th>
                <th>Điểm chuẩn</th>
                <th>Thời gian thi</th>
                <th>Tên trong Sheet Excel</th>
                <th>Hiển thị</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td>{subject.id}</td>
                  <td>
                    {editingSubjectId === subject.id ? (
                      <input
                        type="text"
                        value={editingSubjectName}
                        onChange={(e) => setEditingSubjectName(e.target.value)}
                      />
                    ) : (
                      subject.name
                    )}
                  </td>
                  <td>
                    {editingSubjectId === subject.id ? (
                      <input
                        type="number"
                        value={editingSubjectNumberOfQuestions}
                        // onChange={(e) => setEditingSubjectNumberOfQuestions(Number(e.target.value))}
                        readOnly
                      />
                    ) : (
                      subject.numberofquestion
                    )}
                  </td>
                  <td>
                    {editingSubjectId === subject.id ? (
                      <input
                        type="number"
                        value={editingSubjectThreshold}
                        onChange={(e) => setEditingSubjectThreshold(Number(e.target.value))}
                      />
                    ) : (
                      subject.threshold
                    )}
                  </td>
                  <td>
                    {editingSubjectId === subject.id ? (
                      <input
                        type="number"
                        value={editingTimeFinish}
                        onChange={(e) => setEditingTimeFinish(Number(e.target.value))}
                      />
                    ) : (
                      subject.timeFinish
                    )}
                  </td>
                  <td>
                    {editingSubjectId === subject.id ? (
                      <input
                        type="text"
                        value={editingSubjectNameEx}
                        onChange={(e) => setEditingSubjectNameEx(e.target.value)}
                      />
                    ) : (
                      subject.nameEx
                    )}
                  </td>
                  <td>
                    {editingSubjectId === subject.id ? (
                      <>
                        <div className="show-table">
                          <div>
                            <input
                              type="radio"
                              id="show"
                              name="showsubjectedit"
                              value="true"
                              checked={editingSubjectShowSubject === true}  // Kiểm tra nếu giá trị hiện tại là true
                              onChange={() => setEditingSubjectShowSubject(true)}  // Cập nhật trạng thái khi chọn "Show"
                            />
                            <label htmlFor="show">Show</label>
                          </div>

                          <div><input
                            type="radio"
                            id="hide"
                            name="showsubjectedit"
                            value="false"
                            checked={editingSubjectShowSubject === false}  // Kiểm tra nếu giá trị hiện tại là false
                            onChange={() => setEditingSubjectShowSubject(false)}  // Cập nhật trạng thái khi chọn "Unshow"
                          />
                            <label htmlFor="hide">Unshow</label></div>

                        </div>
                      </>
                    ) : (
                      subject.showsubject ? 'Show' : 'Unshow'  // Hiển thị trạng thái theo dữ liệu gốc khi không trong chế độ chỉnh sửa
                    )}
                  </td>
                  <td>
                    {editingSubjectId === subject.id ? (
                      <>
                        <button onClick={() => handleUpdateSubject(subject.id)}>Lưu</button>
                        <button onClick={() => setEditingSubjectId(null)}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingSubjectId(subject.id);
                            setEditingSubjectName(subject.name);
                            setEditingSubjectThreshold(subject.threshold);
                            setEditingSubjectNumberOfQuestions(subject.numberofquestion); // Hiển thị số câu hỏi khi sửa
                            setEditingSubjectNameEx(subject.nameEx);
                            setEditingSubjectShowSubject(subject.showsubject);
                            setEditingTimeFinish(subject.timeFinish)
                          }}
                        >
                          Sửa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default Setting;
