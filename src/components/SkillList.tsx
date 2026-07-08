import { skillCatalog } from "../skills/skillCatalog";
import { runSkill } from "../skills/skillRunner";

export function SkillList() {
  return (
    <div className="skill-grid">
      {skillCatalog.map((skill) => {
        const runResult = runSkill(skill.id);

        return (
          <article className="panel" key={skill.id}>
            <div className="panel__heading">
              <h3>{skill.name}</h3>
              <span className={`status status--${skill.status}`}>{skill.status}</span>
            </div>
            <p>{skill.description}</p>
            <dl className="definition-list">
              <div>
                <dt>Input</dt>
                <dd>{skill.input}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>{skill.output}</dd>
              </div>
            </dl>
            <p className="muted">{runResult.message}</p>
          </article>
        );
      })}
    </div>
  );
}

