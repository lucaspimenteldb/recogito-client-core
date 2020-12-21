import React from 'preact/compat';
import Comment from './Comment';
import TextEntryField from './TextEntryField';
import i18n from '../../../i18n';
import PurposeSelect, { PURPOSES } from './PurposeSelect';

const validPurposes = PURPOSES.map(p => p.value);

/**
 * Comments are TextualBodies where the purpose field is either 
 * blank or 'commenting' or 'replying'
 */
const isComment = (body, matchAllPurposes) => {
  const hasMatchingPurpose = matchAllPurposes ? 
    validPurposes.indexOf(body.purpose) > -1 : body.purpose == 'commenting' || body.purpose == 'replying';

  return body.type === 'TextualBody' && (
    !body.hasOwnProperty('purpose') || hasMatchingPurpose
  );
}

/**
 * The draft reply is a comment body with a 'draft' flag
 */
const getDraftReply = (existingDraft, isReply) => {
  const purpose = isReply ? 'replying' : 'commenting';
  return existingDraft ? existingDraft : {
    type: 'TextualBody', value: '', purpose, draft: true
  };
};

/** 
 * Renders a list of comment bodies, followed by a 'reply' field.
 */
const CommentWidget = props => {
  // All comments
  const all = props.annotation ? 
    props.annotation.bodies.filter(body => isComment(body, props.purposeSelector)) : [];

  // Add a draft reply if there isn't one already
  const draftReply = getDraftReply(all.find(b => b.draft == true), all.length > 1);
  
  // All except draft reply
  const comments = all.filter(b => b != draftReply);

  const onEditReply = evt => {
    const prev = draftReply.value;
    const updated = evt.target.value;

    if (prev.length === 0 && updated.length > 0) {
      props.onAppendBody({ ...draftReply, value: updated });
    } else if (prev.length > 0 && updated.length === 0) {
      props.onRemoveBody(draftReply);
    } else {
      props.onUpdateBody(draftReply, { ...draftReply, value: updated });
    }
  }

  const onChangeReplyPurpose = purpose =>
    props.onUpdateBody(draftReply, { ...draftReply, purpose: purpose.value });

  // A comment should be read-only if:
  // - the global read-only flag is set
  // - the current rule is 'MINE_ONLY' and the creator ID differs 
  // The 'editable' config flag overrides the global setting, if any
  const isReadOnly = body =>  {
    if (props.editable === true)
      return false;

    if (props.editable === false)
      return true;

    if (props.editable === 'MINE_ONLY') {
      // The original creator of the body
      const creator = body.creator?.id;

      // The current user
      const me = props.env.user?.id;

      return me !== creator;
    }

    // Global setting as last possible option
    return props.readOnly;
  }

  return (
    <>
      { comments.map((body, idx) => 
        <Comment 
          key={idx} 
          env={props.env}
          purposeSelector={props.purposeSelector}
          readOnly={isReadOnly(body)} 
          body={body} 
          onUpdate={props.onUpdateBody}
          onDelete={props.onRemoveBody}
          onSaveAndClose={props.onSaveAndClose} />
      )}

      { !props.readOnly && props.annotation &&
        <div className="r6o-widget comment editable">
          <TextEntryField
            content={draftReply.value}
            editable={true}
            placeholder={comments.length > 0 ? i18n.t('Add a reply...') : i18n.t('Add a comment...')}
            onChange={onEditReply}
            onSaveAndClose={() => props.onSaveAndClose()}
          /> 
        { props.purposeSelector  && draftReply.value.length > 0 &&
          <PurposeSelect
              editable={true}
              content={draftReply.purpose}
              onChange={onChangeReplyPurpose} 
              onSaveAndClose={() => props.onSaveAndClose()}
            />
          } 
        </div>
      }
    </>
  )

}

export default CommentWidget;