import Link from "next/link";
import { Empty, number, date, Pagination, pageNumber, queryText, type Query } from "./UI";
import Filters from "./Filters";
import { SearchResults } from "./SearchProvider";
import { MinecraftIcon } from "./MinecraftIcon";
import HeadStack from "./HeadStack";
import PlayerVisual from "./PlayerVisual";
import CategoryBadge from "./CategoryBadge";
import { excludedCategories, nameSort, sortRows, type CollectionRow, type SortOption } from "../lib/collections";
import CategoryFilters from "./CategoryFilters";
import { formatStatValue } from "../lib/stat-units";

type Column = { key: "category" | "value" | "rank" | "points" | "time" | "completed" | "participants"; label: string };
type Props = {
  rows: CollectionRow[]; query: Query; columns: Column[]; sortOptions?: SortOption[]; defaultSort?: string;
  defaultView?: "cards" | "list"; prefix?: string; categories?: boolean; categoryLabel?: string;
  label?: string; placeholder?: string; empty?: string; pageSize?: number;
};

export default function Collection({ rows, query, columns, sortOptions = nameSort, defaultSort = "name_asc", defaultView = "cards", prefix = "", categories = false, categoryLabel = "Kategorie", label = "Einträge", placeholder = "Einträge suchen …", empty = "Keine passenden Einträge gefunden.", pageSize = 15 }: Props) {
  const search = queryText(query, `${prefix}search`);
  const category = queryText(query, `${prefix}category`);
  const requestedSort = queryText(query, `${prefix}sort`);
  const sort = sortOptions.some(option => option.value === requestedSort) ? requestedSort : defaultSort;
  const requestedView = queryText(query, `${prefix}view`);
  const view = requestedView === "list" || requestedView === "cards" ? requestedView : defaultView;
  const categoryList = categories ? [...new Set(rows.map(row => row.category).filter((value): value is string => !!value))].sort() : [];
  const excluded = excludedCategories(query, prefix);
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = sortRows(rows.filter(row => (!categories || ((!category || row.category === category) && (!row.category || !excluded.includes(row.category)))) && (!normalizedSearch || `${row.name} ${row.id} ${row.searchText ?? ""}`.toLowerCase().includes(normalizedSearch))), sort);
  const page = pageNumber(query, filtered.length, pageSize, prefix);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  function cell(row: CollectionRow, column: Column) {
    if (column.key === "category") return row.category ? <CategoryBadge category={row.category} /> : "–";
    if (column.key === "participants") return <HeadStack players={row.heads ?? []} total={row.participants ?? 0} />;
    if (column.key === "time") return row.time ? date(row.time) : "–";
    if (column.key === "completed") return <span className={row.completed ? "stats-completed" : "stats-muted"}>{row.completed ? "✓ Abgeschlossen" : "Noch offen"}</span>;
    if (column.key === "rank") return row.rank ? <span className={`stats-rank rank-${row.rank}`}>#{row.rank}</span> : "–";
    if (column.key === "points") return <span className="stats-points">{number(row.points ?? 0)}</span>;
    return row.value === undefined ? "–" : <span className="stats-value">{row.statKey ? formatStatValue(row.statKey, row.value) : number(row.value)}</span>;
  }
  function icon(row: CollectionRow) {
    return row.player ? <PlayerVisual uuid={row.player.uuid} username={row.player.username} size={40} /> : row.iconKey ? <MinecraftIcon statKey={row.iconKey} achievement={row.achievement} /> : null;
  }
  return <>
    <Filters search={search} category={category} categories={categoryList} categoryLabel={categoryLabel} sort={sort} sortOptions={sortOptions} defaultSort={defaultSort} view={view} defaultView={defaultView} prefix={prefix} label={label} placeholder={placeholder} />
    {categories && categoryList.length > 0 && <CategoryFilters categories={categoryList} excluded={excluded} prefix={prefix} />}
    <p className="stats-note" aria-live="polite">{number(filtered.length)} {label}</p>
    <SearchResults table={view === "list"}>
      {!visible.length ? <Empty>{empty}</Empty> : view === "list" ? <div className="stats-table-wrap"><table className="stats-table"><thead><tr><th scope="col">Name</th>{columns.map(column => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.id} className={row.rank && row.rank <= 3 ? `stats-podium-row podium-${row.rank}` : undefined}>
        <td><Link prefetch={false} className="stats-record-name" href={row.href}><span title={row.name}>{row.name}</span>{icon(row)}</Link></td>{columns.map(column => <td key={column.key}>{cell(row, column)}</td>)}
      </tr>)}</tbody></table></div> : <div className="stats-grid">{visible.map(row => <article className={`stats-card ${row.rank && row.rank <= 3 ? `stats-award-card podium-${row.rank}` : ""}`} key={row.id}>
        <Link prefetch={false} className="stats-card-main" href={row.href}>{row.category && <CategoryBadge category={row.category} />}<div className="stats-card-title"><h2 title={row.name}>{row.name}</h2>{icon(row)}</div>{row.description && <p>{row.description}</p>}</Link>
        <div className="stats-record-details">{columns.filter(column => column.key !== "category" && column.key !== "participants").map(column => <div key={column.key}><span className="stats-muted">{column.label}</span><strong>{cell(row, column)}</strong></div>)}</div>
        <div className="stats-card-bottom">{row.heads ? <HeadStack players={row.heads} total={row.participants ?? 0} /> : <span className="stats-muted">Details</span>}<Link prefetch={false} href={row.href} aria-label={`${row.name}: Details öffnen`}>↗</Link></div>
      </article>)}</div>}
      <Pagination page={page} total={filtered.length} query={query} size={pageSize} prefix={prefix} />
    </SearchResults>
  </>;
}
