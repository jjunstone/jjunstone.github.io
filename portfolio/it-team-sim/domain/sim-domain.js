/**
 * IT TEAM SIMULATOR — Domain Layer
 *
 * 순수 상태 전이 로직. DOM 접근 없음, 렌더링 없음.
 * UI는 이 레이어를 읽기만 하고, 판단 규칙을 다시 구현하지 않는다.
 *
 * 흐름: 사건 선택 -> 단계별 선택 -> 타임라인/보고스레드 기록 -> 종결(resolved/partial)
 *
 * thread: 보고 체계를 순차적으로 보여주는 메시지 로그.
 * 각 단계가 열릴 때 speaker -> listener(또는 전체) 메시지가 하나 쌓이고,
 * 선택을 할 때 플레이어의 조치 메시지가 하나 더 쌓인다. 이메일/채팅 스레드처럼
 * 시간 순서대로 누적되며, UI는 이 배열을 그대로 렌더링한다.
 */
window.ITSimDomain = (function () {
  'use strict';

  /**
   * 하나의 진행 중인 사건 세션을 만든다.
   * @param {Object} scenario - ITSimData.scenarios 안의 시나리오 객체
   */
  function createCaseSession(scenario) {
    var stageMap = {};
    scenario.stages.forEach(function (s) { stageMap[s.id] = s; });

    var state = {
      scenario: scenario,
      currentStageId: scenario.stages[0].id,
      timeline: [
        { at: '00:00', label: '사건 접수', detail: scenario.briefing },
      ],
      thread: [],
      elapsedMinutes: 0,
      done: false,
      result: null,
    };

    function currentStage() {
      return stageMap[state.currentStageId];
    }

    function pushThreadMessage(stage) {
      if (!stage || !stage.speaker) return;
      state.thread.push({
        at: formatElapsed(state.elapsedMinutes),
        from: stage.speaker,
        to: stage.listener || null,
        body: stage.narration || stage.summary || '',
        terminal: !!stage.terminal,
        result: stage.result || null,
      });
    }

    // 최초 단계의 보고 메시지를 스레드에 기록한다.
    pushThreadMessage(currentStage());

    /**
     * 선택지를 실행한다. choiceId가 현재 단계에 없으면 아무 것도 하지 않는다(방어적 무시).
     */
    function choose(choiceId) {
      if (state.done) return state;
      var stage = currentStage();
      if (!stage || stage.terminal) return state;

      var choice = (stage.choices || []).filter(function (c) { return c.id === choiceId; })[0];
      if (!choice) return state;

      state.elapsedMinutes += 2; // 선택마다 가상 시간 2분씩 흐른다 (단순 모델)
      state.timeline.push({
        at: formatElapsed(state.elapsedMinutes),
        label: choice.label,
        detail: choice.consequence || '',
      });

      // 플레이어의 조치 자체도 스레드에 하나의 메시지로 기록한다 (발신자: 플레이어 역할).
      state.thread.push({
        at: formatElapsed(state.elapsedMinutes),
        from: scenario.player,
        to: null,
        body: choice.label + (choice.consequence ? ' — ' + choice.consequence : ''),
        isAction: true,
      });

      state.currentStageId = choice.next;
      var nextStage = stageMap[state.currentStageId];
      pushThreadMessage(nextStage);

      if (nextStage && nextStage.terminal) {
        state.done = true;
        state.result = nextStage.result;
        state.timeline.push({
          at: formatElapsed(state.elapsedMinutes),
          label: '사건 종결 (' + resultLabel(nextStage.result) + ')',
          detail: nextStage.summary,
        });
      }
      return state;
    }

    function formatElapsed(mins) {
      var h = Math.floor(mins / 60);
      var m = mins % 60;
      return (h > 0 ? h + '시간 ' : '') + m + '분';
    }

    function resultLabel(result) {
      if (result === 'resolved') return '정상 해결';
      if (result === 'partial') return '부분 해결 — 개선 필요';
      return result;
    }

    return {
      getState: function () { return state; },
      currentStage: currentStage,
      choose: choose,
    };
  }

  return {
    createCaseSession: createCaseSession,
  };
})();
