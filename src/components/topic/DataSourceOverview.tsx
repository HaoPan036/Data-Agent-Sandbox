import { schemaByTable } from "../../agent/schema";
import type { Topic } from "../../topics/topicTypes";

interface DataSourceOverviewProps {
  topic: Topic;
}

export function DataSourceOverview({ topic }: DataSourceOverviewProps) {
  return (
    <section className="panel" id="data-sources">
      <div className="panel__heading">
        <h2>Data Source Overview</h2>
        <span className="muted">{topic.dataSources.length} sources</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Rows</th>
              <th>Grain</th>
            </tr>
          </thead>
          <tbody>
            {topic.dataSources.map((source) => {
              const schema = source.tableName ? schemaByTable[source.tableName] : undefined;

              return (
                <tr key={source.id}>
                  <td>
                    <strong>{source.name}</strong>
                    <span>{source.description}</span>
                  </td>
                  <td>{source.sourceType}</td>
                  <td>
                    <strong>{source.rowCountLabel}</strong>
                    <span>{source.freshness}</span>
                  </td>
                  <td>{schema?.grain ?? "Documentation or demo source"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
