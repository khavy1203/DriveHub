import React, { useState, useEffect } from "react";
import useApiService from "../../../../services/useApiService";
import { ApiResponse, UserStatus, Rank, Subject } from "../../../../interfaces";
import "./SettingForm.scss";

const Setting: React.FC = () => {
  const { get, post, put } = useApiService();

  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);

  const [newStatus, setNewStatus] = useState("");
  const [newRankName, setNewRankName] = useState("");

  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingRankId, setEditingRankId] = useState<number | null>(null);

  const [editingNameStatus, setEditingNameStatus] = useState("");
  const [editingNameRank, setEditingNameRank] = useState("");
  const [selectedRank, setSelectedRank] = useState<any>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectNumberOfQuestions, setNewSubjectNumberOfQuestions] = useState(10);
  const [newSubjectThreshold, setNewSubjectThreshold] = useState(5);
  const [newSubjectNameEx, setNewSubjectNameEx] = useState("");
  const [newTimeFinish, setNewTimeFinish] = useState(6);

  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [editingSubjectNumberOfQuestions, setEditingSubjectNumberOfQuestions] = useState(10);
  const [editingSubjectThreshold, setEditingSubjectThreshold] = useState(5);
  const [editingSubjectNameEx, setEditingSubjectNameEx] = useState("");
  const [newSubjectShowSubject, setNewSubjectShowSubject] = useState<boolean>(true);
  const [editingSubjectShowSubject, setEditingSubjectShowSubject] = useState<boolean>(true);
  const [editingTimeFinish, setEditingTimeFinish] = useState(6);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const responseGetStatus = await get<ApiResponse<UserStatus[]>>("/api/status");
        setUserStatuses(responseGetStatus.DT);

        const responseGetRanks = await get<ApiResponse<Rank[]>>("/api/rank/getRank");
        setRanks(responseGetRanks.DT);

        if (responseGetRanks.DT.length) {
          setSelectedRank(responseGetRanks.DT[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Không thể tải dữ liệu.");
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
      console.error("Error fetching subjects:", error);
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus.trim()) return alert("Tên trạng thái không được để trống.");
    try {
      await post("/api/status", { namestatus: newStatus });
      setNewStatus("");
      const updated = await get<ApiResponse<UserStatus[]>>("/api/status");
      setUserStatuses(updated.DT);
    } catch { alert("Lỗi khi tạo trạng thái."); }
  };

  const handleUpdateStatus = async (id: number) => {
    if (!editingNameStatus.trim()) return alert("Tên trạng thái không được để trống.");
    try {
      await put(`/api/status/${id}`, { namestatus: editingNameStatus });
      setEditingStatusId(null);
      setEditingNameStatus("");
      const updated = await get<ApiResponse<UserStatus[]>>("/api/status");
      setUserStatuses(updated.DT);
    } catch { alert("Lỗi khi cập nhật trạng thái."); }
  };

  const handleDeleteStatus = async (_id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa trạng thái này?")) return;
    try {
      // await del(`/api/status/${_id}`);
    } catch { alert("Lỗi khi xóa trạng thái."); }
  };

  const handleCreateRank = async () => {
    if (!newRankName.trim()) return alert("Tên hạng không được để trống.");
    try {
      await post("/api/rank/create-rank", { name: newRankName });
      setNewRankName("");
      const updated = await get<ApiResponse<Rank[]>>("/api/rank/getRank");
      setRanks(updated.DT);
    } catch { alert("Lỗi khi tạo hạng."); }
  };

  const handleUpdateRank = async (id: number) => {
    if (!editingNameRank.trim()) return alert("Tên hạng không được để trống.");
    try {
      await put(`/api/rank/update-rank/${id}`, { name: editingNameRank });
      setEditingRankId(null);
      setEditingNameRank("");
      const updated = await get<ApiResponse<Rank[]>>("/api/rank/getRank");
      setRanks(updated.DT);
    } catch { alert("Lỗi khi cập nhật hạng."); }
  };

  const handleDeleteRank = async (_id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hạng này?")) return;
    try {
      // await del(`/api/rank/${_id}`);
    } catch { alert("Lỗi khi xóa hạng."); }
  };

  const handleRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRank(Number(e.target.value));
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return alert("Tên môn học không được để trống.");
    if (!newSubjectNameEx.trim()) return alert("Tên Sheet Excel không được để trống.");
    try {
      await post("/api/subject/create-subject", {
        rankId: selectedRank,
        name: newSubjectName,
        threshold: newSubjectThreshold,
        nameEx: newSubjectNameEx,
        numberofquestion: newSubjectNumberOfQuestions,
        showsubject: newSubjectShowSubject,
        timeFinish: newTimeFinish,
      });
      setNewSubjectName("");
      setNewSubjectNameEx("");
      setNewSubjectThreshold(5);
      setNewSubjectNumberOfQuestions(10);
      setNewSubjectShowSubject(true);
      setNewTimeFinish(6);
      await fetchSubjects();
    } catch { alert("Lỗi khi tạo môn học."); }
  };

  const handleUpdateSubject = async (id: number) => {
    if (!editingSubjectName.trim() || !editingSubjectNameEx.trim()) return alert("Có trường không hợp lệ");
    try {
      await put(`/api/subject/update-subject/${id}`, {
        name: editingSubjectName,
        threshold: editingSubjectThreshold,
        showsubject: editingSubjectShowSubject,
        nameEx: editingSubjectNameEx,
        timeFinish: editingTimeFinish,
      });
      setEditingSubjectId(null);
      setEditingSubjectName("");
      setEditingSubjectNameEx("");
      setEditingSubjectThreshold(5);
      setEditingTimeFinish(6);
      setEditingSubjectNumberOfQuestions(10);
      setEditingSubjectShowSubject(true);
      await fetchSubjects();
    } catch { alert("Lỗi khi cập nhật môn học."); }
  };

  return (
    <div className="setting-page">

      {/* ── Row 1: Trạng thái + Hạng ── */}
      <div className="setting-page__top">

        {/* Trạng thái người dùng */}
        <div className="s-card">
          <div className="s-card__header">
            <span className="s-card__icon">🏷️</span>
            <h3>Quản lý trạng thái người dùng</h3>
          </div>
          <div className="s-card__body">
            <div className="s-add-row">
              <input
                className="s-input"
                type="text"
                placeholder="Nhập tên trạng thái mới..."
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateStatus()}
              />
              <button className="s-btn s-btn--primary" onClick={handleCreateStatus}>+ Thêm</button>
            </div>
            <div className="s-table-wrap">
              <table className="s-table">
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
                        {editingStatusId === status.id
                          ? <input className="s-input s-input--sm" value={editingNameStatus} onChange={(e) => setEditingNameStatus(e.target.value)} />
                          : status.namestatus}
                      </td>
                      <td>
                        <div className="s-action-cell">
                          {editingStatusId === status.id ? (
                            <>
                              <button className="s-btn s-btn--success s-btn--sm" onClick={() => handleUpdateStatus(status.id)}>Lưu</button>
                              <button className="s-btn s-btn--ghost s-btn--sm" onClick={() => setEditingStatusId(null)}>Hủy</button>
                            </>
                          ) : (
                            <>
                              <button className="s-btn s-btn--primary s-btn--sm" onClick={() => { setEditingStatusId(status.id); setEditingNameStatus(status.namestatus); }}>Sửa</button>
                              <button className="s-btn s-btn--danger s-btn--sm" onClick={() => handleDeleteStatus(status.id)}>Xóa</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Hạng GPLX */}
        <div className="s-card">
          <div className="s-card__header">
            <span className="s-card__icon">🚗</span>
            <h3>Quản lý Hạng GPLX</h3>
          </div>
          <div className="s-card__body">
            <div className="s-add-row">
              <input
                className="s-input"
                type="text"
                placeholder="Nhập tên hạng xe mới..."
                value={newRankName}
                onChange={(e) => setNewRankName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRank()}
              />
              <button className="s-btn s-btn--primary" onClick={handleCreateRank}>+ Thêm</button>
            </div>
            <div className="s-table-wrap">
              <table className="s-table">
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
                        {editingRankId === rank.id
                          ? <input className="s-input s-input--sm" value={editingNameRank} onChange={(e) => setEditingNameRank(e.target.value)} />
                          : rank.name}
                      </td>
                      <td>
                        <div className="s-action-cell">
                          {editingRankId === rank.id ? (
                            <>
                              <button className="s-btn s-btn--success s-btn--sm" onClick={() => handleUpdateRank(rank.id)}>Lưu</button>
                              <button className="s-btn s-btn--ghost s-btn--sm" onClick={() => setEditingRankId(null)}>Hủy</button>
                            </>
                          ) : (
                            <>
                              <button className="s-btn s-btn--primary s-btn--sm" onClick={() => { setEditingRankId(rank.id); setEditingNameRank(rank.name); }}>Sửa</button>
                              <button className="s-btn s-btn--danger s-btn--sm" onClick={() => handleDeleteRank(rank.id)}>Xóa</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Thêm môn học + Bảng môn học ── */}
      <div className="setting-page__bottom">

        {/* Form thêm môn học */}
        <div className="s-card">
          <div className="s-card__header">
            <span className="s-card__icon">📚</span>
            <h3>Thêm môn học theo hạng</h3>
          </div>
          <div className="s-card__body">
            <div className="s-rank-select">
              <label>Hạng:</label>
              <select className="s-input" value={selectedRank || ""} onChange={handleRankChange}>
                <option value="" disabled>-- Chọn hạng --</option>
                {ranks.map((rank) => (
                  <option key={rank.id} value={rank.id}>{rank.name}</option>
                ))}
              </select>
            </div>

            <div className="s-field">
              <label>Tên môn học</label>
              <input className="s-input" type="text" placeholder="VD: Luật giao thông" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} />
            </div>

            <div className="s-field">
              <label>Tên Sheet trong Excel</label>
              <input className="s-input" type="text" placeholder="Phải khớp chính xác tên Sheet" value={newSubjectNameEx} onChange={(e) => setNewSubjectNameEx(e.target.value)} />
            </div>

            <div className="s-field">
              <label>Số câu hỏi (khớp với Excel)</label>
              <input className="s-input" type="number" value={newSubjectNumberOfQuestions} onChange={(e) => setNewSubjectNumberOfQuestions(Number(e.target.value))} />
            </div>

            <div className="s-field">
              <label>Điểm chuẩn qua môn</label>
              <input className="s-input" type="number" value={newSubjectThreshold} onChange={(e) => setNewSubjectThreshold(Number(e.target.value))} />
            </div>

            <div className="s-field">
              <label>Thời gian thi (phút)</label>
              <input className="s-input" type="number" value={newTimeFinish} onChange={(e) => setNewTimeFinish(Number(e.target.value))} />
            </div>

            <div className="s-field">
              <label>Hiển thị môn học</label>
              <div className="s-toggle">
                <label className={newSubjectShowSubject ? "active-show" : ""}>
                  <input type="radio" name="showsubject" checked={newSubjectShowSubject === true} onChange={() => setNewSubjectShowSubject(true)} />
                  ✅ Hiển thị
                </label>
                <label className={newSubjectShowSubject ? "" : "active-hide"}>
                  <input type="radio" name="showsubject" checked={newSubjectShowSubject === false} onChange={() => setNewSubjectShowSubject(false)} />
                  🚫 Ẩn
                </label>
              </div>
            </div>

            <button className="s-btn s-btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={handleCreateSubject}>
              + Thêm môn học
            </button>
          </div>
        </div>

        {/* Bảng môn học */}
        <div className="s-card">
          <div className="s-card__header">
            <span className="s-card__icon">📋</span>
            <h3>Danh sách môn học — {ranks.find(r => r.id === selectedRank)?.name ?? "..."}</h3>
          </div>
          <div className="s-card__body">
            <div className="s-table-wrap">
              <table className="s-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên môn học</th>
                    <th>Số câu</th>
                    <th>Điểm chuẩn</th>
                    <th>TG thi</th>
                    <th>Sheet Excel</th>
                    <th>Hiển thị</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>{subject.id}</td>
                      <td>
                        {editingSubjectId === subject.id
                          ? <input className="s-input s-input--sm" value={editingSubjectName} onChange={(e) => setEditingSubjectName(e.target.value)} />
                          : subject.name}
                      </td>
                      <td>
                        {editingSubjectId === subject.id
                          ? <input className="s-input s-input--sm" type="number" value={editingSubjectNumberOfQuestions} readOnly />
                          : subject.numberofquestion}
                      </td>
                      <td>
                        {editingSubjectId === subject.id
                          ? <input className="s-input s-input--sm" type="number" value={editingSubjectThreshold} onChange={(e) => setEditingSubjectThreshold(Number(e.target.value))} />
                          : subject.threshold}
                      </td>
                      <td>
                        {editingSubjectId === subject.id
                          ? <input className="s-input s-input--sm" type="number" value={editingTimeFinish} onChange={(e) => setEditingTimeFinish(Number(e.target.value))} />
                          : `${subject.timeFinish}p`}
                      </td>
                      <td>
                        {editingSubjectId === subject.id
                          ? <input className="s-input s-input--sm" value={editingSubjectNameEx} onChange={(e) => setEditingSubjectNameEx(e.target.value)} />
                          : subject.nameEx}
                      </td>
                      <td>
                        {editingSubjectId === subject.id ? (
                          <div className="s-toggle">
                            <label className={editingSubjectShowSubject ? "active-show" : ""}>
                              <input type="radio" name="showsubjectedit" checked={editingSubjectShowSubject === true} onChange={() => setEditingSubjectShowSubject(true)} />
                              ✅
                            </label>
                            <label className={!editingSubjectShowSubject ? "active-hide" : ""}>
                              <input type="radio" name="showsubjectedit" checked={editingSubjectShowSubject === false} onChange={() => setEditingSubjectShowSubject(false)} />
                              🚫
                            </label>
                          </div>
                        ) : (
                          <span className={`s-badge ${subject.showsubject ? "s-badge--show" : "s-badge--hide"}`}>
                            {subject.showsubject ? "Hiển thị" : "Ẩn"}
                          </span>

                        )}
                      </td>
                      <td>
                        <div className="s-action-cell">
                          {editingSubjectId === subject.id ? (
                            <>
                              <button className="s-btn s-btn--success s-btn--sm" onClick={() => handleUpdateSubject(subject.id)}>Lưu</button>
                              <button className="s-btn s-btn--ghost s-btn--sm" onClick={() => setEditingSubjectId(null)}>Hủy</button>
                            </>
                          ) : (
                            <button className="s-btn s-btn--primary s-btn--sm" onClick={() => {
                              setEditingSubjectId(subject.id);
                              setEditingSubjectName(subject.name);
                              setEditingSubjectThreshold(subject.threshold);
                              setEditingSubjectNumberOfQuestions(subject.numberofquestion);
                              setEditingSubjectNameEx(subject.nameEx);
                              setEditingSubjectShowSubject(subject.showsubject);
                              setEditingTimeFinish(subject.timeFinish);
                            }}>Sửa</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
