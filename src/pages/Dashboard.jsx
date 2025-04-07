// ✅ 전체 코드 복구 + 날짜 정렬 기능 + 모든 누락된 핸들러 추가 포함

import React, { useState, useMemo, useRef, useEffect } from "react";
import '../App.css';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const formatNumber = (num) => new Intl.NumberFormat().format(num);
const getCTR = (clicks, impressions) => (!impressions ? "0%" : ((clicks / impressions) * 100).toFixed(2) + "%");

function Dashboard() {
  const platformOptions = ["Google", "Meta", "X", "Naver", "Kakao"];
  const platformColors = {
    cost: "#8884d8",  // 파란색
    impressions: "#82ca9d",  // 초록색
    clicks: "#ffc658",  // 노란색
  };

  const creativeColors = {
    cost: "#8884d8",  // 파란색
    impressions: "#82ca9d",  // 초록색
    clicks: "#ffc658",  // 노란색
  };
  
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRowData, setNewRowData] = useState({
   date: dayjs().format("YYYY-MM-DD"),
   platform: "",
   creative: "",
   cost: 0,
   clicks: 0,
   impressions: 0,
   signups: 0,
   comment: "",
   });

  const [editingDateIndex, setEditingDateIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedPlatformMetrics, setSelectedPlatformMetrics] = useState(["cost", "impressions", "clicks"]);
  const [selectedCreativeMetrics, setSelectedCreativeMetrics] = useState(["cost", "impressions", "clicks"]);
  const defaultMetrics = [
    { key: "cost", color: "#8884d8" },
    { key: "impressions", color: "#82ca9d" },
    { key: "clicks", color: "#ffc658" }
  ];
  const [visibleGraphMetrics, setVisibleGraphMetrics] = useState(defaultMetrics.map(m => m.key));
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [searchDateFilter, setSearchDateFilter] = useState({ from: '', to: '' });
  const dateInputRef = useRef(null);

  const fetchFirestoreData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "adData"));
      const firestoreData = [];
      querySnapshot.forEach((doc) => {
        firestoreData.push({ id: doc.id, ...doc.data() });
      });
      setData(firestoreData);
    } catch (e) {
      console.error("❌ Firestore에서 데이터 가져오기 실패:", e);
    }
  };

  useEffect(() => {
    fetchFirestoreData();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dateInputRef.current && !dateInputRef.current.contains(e.target)) {
        setEditingDateIndex(null);
      }
    }
    if (editingDateIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingDateIndex]);

  const handleSortByDate = () => {
    setSortConfig((prev) => ({
      key: "date",
      direction: prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((key) => row[key]).join(","));
    const csvContent = [headers.join(","), ...rows].join("\n");
    saveAs(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), "ad_data.csv");
  };

  const handleExportJSON = () => {
    saveAs(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "ad_data.json");
  };

  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleCellChange = async (key, value, itemId) => {
    const numericKeys = ["cost", "revenue", "clicks", "impressions", "signups"];

    const updatedData = data.map((row) => {
      if (row.id === itemId) {
    return {
      ...row,
      [key]: numericKeys.includes(key)
        ? (isNaN(Number(value)) ? 0 : Number(value))
        : value,
    };
  }
  return row;
});
    setData(updatedData);

    try {
      const rowToUpdate = updatedData.find((r) => r.id === itemId);
      if (rowToUpdate) {
        const docRef = doc(db, "adData", itemId);
        await updateDoc(docRef, { [key]: rowToUpdate[key] });
        console.log(`✅ Firestore 문서 ${itemId} 업데이트됨: ${key} = ${rowToUpdate[key]}`);
      }
    } catch (e) {
      console.error("❌ Firestore 업데이트 실패:", e);
    }
  };

  const handleSave = async () => {
    try {
      const docRef = await addDoc(collection(db, "adData"), {
        ...newRowData,
        cost: Number(newRowData.cost),
        impressions: Number(newRowData.impressions),
        clicks: Number(newRowData.clicks),
        signups: Number(newRowData.signups),
        createdAt: new Date(),
      });
  
      setData(prev => [...prev, { id: docRef.id, ...newRowData }]);
  
      // 초기화
      setNewRowData({
        date: dayjs().format("YYYY-MM-DD"),
        platform: "",
        creative: "",
        cost: 0,
        clicks: 0,
        impressions: 0,
        signups: 0,
        comment: "",
      });
  
      setIsModalOpen(false);
      console.log("✅ 새 행 저장 완료");
    } catch (e) {
      console.error("❌ 저장 실패:", e);
    }
  };


  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      alert("삭제할 데이터를 선택해주세요");
      return;
    }

    if (!window.confirm("선택한 데이터를 정말 삭제하시겠습니까?")) return;

    const newData = [];
   for (let row of data) {
    if (selectedRows.includes(row.id)) {
      try {
        await deleteDoc(doc(db, "adData", row.id));
        console.log(`🗑 Firestore 문서 삭제됨: ${row.id}`);
      } catch (e) {
        console.error(`❌ Firestore 문서 삭제 실패: ${row.id}`, e);
      }
    } else {
      newData.push(row); // 삭제 대상이 아니면 유지
    }
  }
    setData(newData);
    setSelectedRows([]);
  };
    const startIndex = (currentPage - 1) * itemsPerPage;

    const filteredSortedData = useMemo(() => {
    let sorted = [...data];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (sortConfig.key === "date") {
          return sortConfig.direction === "asc"
            ? new Date(valA) - new Date(valB)
            : new Date(valB) - new Date(valA);
        }

        if (typeof valA === "string") {
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      });
    }

    return sorted.filter((d) => {
      const itemDate = dayjs(d.date, "YYYY-MM-DD");
      const from = dateFilter.from ? dayjs(dateFilter.from) : null;
      const to = dateFilter.to ? dayjs(dateFilter.to) : null;

      return (!from || itemDate.isAfter(from.subtract(1, "day"))) &&
             (!to || itemDate.isBefore(to.add(1, "day")));
    });
  }, [data, sortConfig, dateFilter]);

  const getDateAggregatedData = () => {
    const result = {};
    filteredSortedData.forEach((item) => {
      const d = item.date;
      if (!result[d]) {
        result[d] = { date: d, cost: 0, impressions: 0, clicks: 0, signups: 0 };
      }
      result[d].cost += item.cost;
      result[d].impressions += item.impressions;
      result[d].clicks += item.clicks;
      result[d].signups += item.signups;
    });
    return Object.values(result);
  };

  const groupBy = (key, dataset = filteredSortedData) => {
    const result = {};
    dataset.forEach((item) => {
      const k = item[key];
      if (!result[k]) result[k] = { label: k, cost: 0, impressions: 0, clicks: 0, signups: 0 };
      result[k].cost += item.cost;
      result[k].impressions += item.impressions;
      result[k].clicks += item.clicks;
      result[k].signups += item.signups;
    });
    return Object.values(result);
  };

  const platformData = groupBy("platform");
  const creativeData = groupBy("creative");

  const columnDefs = [
    {
      label: (
        <span onClick={handleSortByDate} style={{ cursor: 'pointer' }}>
      Date {sortConfig.key === "date" ? (sortConfig.direction === "asc" ? "🔽" : "🔼") : "🔽"}
    </span>
      ),
      key: "date"
    },
    { label: "Platform", key: "platform" },
    { label: "Creative", key: "creative" },
    { label: "Cost", key: "cost" },
    { label: "impressions", key: "impressions" },
    { label: "Clicks", key: "clicks" },
    { label: "CTR", key: "CTR" },
    { label: "CPA", key: "signups" },
    { label: "Comment", key: "comment" }
  ];

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
         {/* ✅ 로그아웃 버튼 */}
    <button
      onClick={() => {
        localStorage.removeItem('auth');
        window.location.href = '/';
      }}
      className="absolute top-4 right-4 text-sm text-gray-500 hover:underline"
    >
      로그아웃
    </button>
     
      <h1>
  <img src="/images/logo2.png" alt="BYUL Beauty Clinic Logo" className="logo" />
</h1>

<div className="chart-header">
  <h3 style={{ margin: 0 }}>📈 일자별 합계 그래프</h3>
  <div className="controls">
    <input
      type="date"
      value={searchDateFilter.from}
      onChange={(e) => setSearchDateFilter(prev => ({ ...prev, from: e.target.value }))}
    />
    <input
      type="date"
      value={searchDateFilter.to}
      onChange={(e) => setSearchDateFilter(prev => ({ ...prev, to: e.target.value }))}
    />
    <button className="btn-search" onClick={() => setDateFilter(searchDateFilter)}>🔍 검색</button>
    <button className="btn-csv" onClick={handleExportCSV}>🟩 CSV</button>
    <button className="btn-json" onClick={handleExportJSON}>📄 JSON</button>
  </div>
</div>

    <div style={{ marginBottom: 12 }}>
      {defaultMetrics.map((metric) => (
       <label key={metric.key} style={{ marginRight: "12px" }}>
        <input
         type="checkbox"
         checked={visibleGraphMetrics.includes(metric.key)}
         onChange={() =>
          setVisibleGraphMetrics((prev) =>
           prev.includes(metric.key)
            ? prev.filter((m) => m !== metric.key)
            : [...prev, metric.key]
        )
      }
      />{" "}
     {metric.key}
  </label>
))}
</div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={getDateAggregatedData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
          {defaultMetrics.map((metric, idx) => (
            <Bar 
             key={idx} 
             yAxisId="left" 
             dataKey={metric.key} 
             barSize={20} 
             fill={metric.color} 
             name={metric.key} 
             hide={!visibleGraphMetrics.includes(metric.key)}/>
          ))}
          <Line yAxisId="right" type="monotone" dataKey="signups" stroke="#ff7300" name="CPA" />
        </ComposedChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: 40 }}>📋 데이터 테이블</h3>
      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr>
            <th></th>
            {columnDefs.map(({ label, key }) => (
              <th key={key}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
         {filteredSortedData
          .slice(startIndex, startIndex + itemsPerPage)
          .map((item, i) => (
            <tr key={startIndex + i}>
            <td style={{ textAlign: "center", height: "40px", padding: 0, width: "40px" }}>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(item.id)}
                  onChange={() => handleRowSelect(item.id)}
                  style={{ transform: "scale(1.2)" }} // 💡 보기 좋게 키워도 OK
                />
              </td>
              {columnDefs.map(({ key }) => {
                let val = key === "CTR" ? getCTR(item.clicks, item.impressions) : item[key];
                if (["cost", "clicks", "impressions", "signups"].includes(key)) {
                  val = formatNumber(val);
                }
                return (
                  <td
                    key={key}
                    style={{
                      textAlign: "center",
                      height: "40px",
                      padding: 0,
                      width: key === "comment" ? "220px" : "120px",
                    }}
                  >
                    {key === "date" ? (
                      editingDateIndex === i ? (
                        <input
                          type="date"
                          ref={dateInputRef}
                          value={item.date}
                          onChange={(e) => handleCellChange("date", e.target.value, i)}
                          onBlur={(e) => {
                            handleCellChange("date", e.target.value, i);
                            setEditingDateIndex(null);
                          }}
                          autoFocus
                          style={{
                            width: "100%",
                            height: "100%",
                            fontSize: "14px",
                            padding: "6px",
                            border: "none",
                            boxSizing: "border-box",
                            textAlign: "center",
                            backgroundColor: "#fff",
                            outline: "none",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => setEditingDateIndex(i)}
                          style={{
                            cursor: "pointer",
                            padding: "6px",
                            fontSize: "14px",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.date}
                        </div>
                      )
                    ) : key === "comment" ? (
                      <textarea
                        value={item.comment}
                        onChange={(e) => handleCellChange("comment", e.target.value, i)}
                        maxLength={200}
                        style={{
                          width: "100%",
                          minHeight: "60px",
                          resize: "none",
                          fontSize: "14px",
                          padding: "6px",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          boxSizing: "border-box",
                        }}
                      />
                    ) : key === "platform" ? (
                      <select
                        value={item.platform || ""}
                        onChange={(e) => handleCellChange("platform", e.target.value, item.id)}
                        style={{
                          width: "100%",
                          padding: "6px",
                          fontSize: "14px",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        {platformOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          handleCellChange(key, e.target.innerText.replace(/,/g, ""), item.id)
                        }
                        dangerouslySetInnerHTML={{ __html: val }}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
  {Array.from({ length: Math.ceil(filteredSortedData.length / itemsPerPage) }, (_, i) => (
    <button
      key={i + 1}
      onClick={() => setCurrentPage(i + 1)}
      style={{
        margin: '0 4px',
        padding: '6px 12px',
        fontWeight: currentPage === i + 1 ? 'bold' : 'normal',
        backgroundColor: currentPage === i + 1 ? '#f0f0f0' : 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      {i + 1}
    </button>
  ))}
</div>

      <div style={{ marginTop: 12 }}>
      <button className="btn-add" onClick={() => setIsModalOpen(true)}>+ 행 추가</button>
      <button className="btn-delete" onClick={handleDelete}>🗑 선택 삭제</button>
      </div>

      <h3 style={{ marginTop: 40 }}>📊 플랫폼별 집계</h3>
<div style={{ marginBottom: "20px" }}>
  {["cost", "impressions", "clicks"].map((metric) => (
    <label key={metric} style={{ marginRight: "12px" }}>
      <input
        type="checkbox"
        checked={selectedPlatformMetrics.includes(metric)}
        onChange={() => {
          setSelectedPlatformMetrics((prev) =>
            prev.includes(metric)
              ? prev.filter((m) => m !== metric)
              : [...prev, metric]

          );
        }}
      />
      {metric}
    </label>
  ))}
</div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={groupBy("platform")}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />

          {/* cost 그래프 */}
    {selectedPlatformMetrics.includes("cost") && (
      <Bar yAxisId="left" dataKey="cost" barSize={20} fill={platformColors["cost"]} name="Cost" />
    )}
    
    {/* impressions 그래프 */}
    {selectedPlatformMetrics.includes("impressions") && (
      <Bar yAxisId="left" dataKey="impressions" barSize={20} fill={platformColors["impressions"]} name="impressions" />
    )}
    
    {/* clicks 그래프 */}
    {selectedPlatformMetrics.includes("clicks") && (
      <Bar yAxisId="left" dataKey="clicks" barSize={20} fill={platformColors["clicks"]} name="Clicks" />
    )}
    
    {/* CPA line graph */}
    <Line yAxisId="right" type="monotone" dataKey="signups" stroke="#ff7300" name="CPA" />
  </ComposedChart>
</ResponsiveContainer>

      <h3 style={{ marginTop: 40 }}>🎨 광고소재별 집계</h3>
      <div style={{ marginBottom: "20px" }}>
      {["cost", "impressions", "clicks"].map((metric) => (
  <label key={metric} style={{ marginRight: "12px" }}>
    <input
      type="checkbox"
      checked={selectedCreativeMetrics.includes(metric)}
      onChange={() =>
        setSelectedCreativeMetrics((prev) =>
          prev.includes(metric)
            ? prev.filter((m) => m !== metric)
            : [...prev, metric]
        )
      }
      />{" "}
    {metric}
  </label>
))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={groupBy("creative")}> 
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
         
          {selectedCreativeMetrics.map((metric, idx) => (
            <Bar key={idx} yAxisId="left" dataKey={metric} barSize={20} fill={platformColors[metric]} name={metric} />
          ))}
          <Line yAxisId="right" type="monotone" dataKey="signups" stroke="#ff7300" name="CPA" />
        </ComposedChart>
      </ResponsiveContainer>
    
    {isModalOpen && (
      <div className="modal-overlay">
        <div className="modal">
          <h3>📋 새 데이터 입력</h3>
    {/* 1행: date / platform / creative */}
  <div className="input-row">
    <div className="field">
      <label>date</label>
      <input
        type="date"
        value={newRowData.date}
        onChange={(e) => setNewRowData({ ...newRowData, date: e.target.value })}
      />
    </div>
    <div className="field">
    <label htmlFor="platform-select">platform</label>  {/* ✅ label 추가 */}
    <select
    value={newRowData.platform}
    onChange={(e) => setNewRowData({ ...newRowData, platform: e.target.value })}
    style={{ width: "100%", padding: "8px", fontSize: "14px", border: "1px solid #ccc", borderRadius: "6px" }}
    >
    <option value="">선택하세요</option>
    {platformOptions.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
    </div>
    <div className="field">
      <label>creative</label>
      <input
        type="text"
        value={newRowData.creative}
        onChange={(e) => setNewRowData({ ...newRowData, creative: e.target.value })}
      />
    </div>
  </div>

  {/* 2행: cost / impressions / clicks / signups */}
  <div className="input-row">
    <div className="field">
      <label>cost</label>
      <input
        type="number"
        value={newRowData.cost}
        onChange={(e) => setNewRowData({ ...newRowData, cost: e.target.value })}
      />
    </div>
    <div className="field">
      <label>impressions</label>
      <input
        type="number"
        value={newRowData.impressions}
        onChange={(e) => setNewRowData({ ...newRowData, impressions: e.target.value })}
      />
    </div>
    <div className="field">
      <label>clicks</label>
      <input
        type="number"
        value={newRowData.clicks}
        onChange={(e) => setNewRowData({ ...newRowData, clicks: e.target.value })}
      />
    </div>
    <div className="field">
      <label>signups</label>
      <input
        type="number"
        value={newRowData.signups}
        onChange={(e) => setNewRowData({ ...newRowData, signups: e.target.value })}
      />
    </div>
  </div>

  {/* 3행: comment */}
  <div className="field" style={{ marginBottom: 16 }}>
    <label>comment</label>
    <textarea
      value={newRowData.comment}
      onChange={(e) => setNewRowData({ ...newRowData, comment: e.target.value })}
      rows={3}
      maxLength={200}
      style={{ width: "100%" }}
    />
  </div>

  {/* 저장/취소 버튼 */}
  <div style={{ textAlign: "right" }}>
    <button onClick={handleSave}>저장</button>
    <button onClick={() => setIsModalOpen(false)} style={{ marginLeft: 8 }}>취소</button>
  </div>

          
        </div>
      </div>
    )}
  </div>

  );
}

export default Dashboard;