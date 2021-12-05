$(document).ready(function(){
    var helpWindow = $('#help_window')
    var openMessage = null
    function lessThanOneWeekAgo(date){
        const WEEK = 1000 * 60 * 60 * 24 * 7;
        const aWeekAgo = Date.now() - WEEK;

        return date < aWeekAgo;
    }
    function showHelpNotice(){
        var buttonHtml = ``
        $.each([
            {
                icon: 'share-square-o',
                color: 'default',
                text: 'ShinobiShop Subscriptions',
                href: 'https://licenses.shinobi.video/subscribe',
                class: ''
            },
            {
                icon: 'paypal',
                color: 'success',
                text: 'Donate by PayPal',
                href: 'https://www.paypal.me/ShinobiCCTV',
                class: ''
            },
            {
                icon: 'bank',
                color: 'default',
                text: 'University of Zurich (UZH)',
                href: 'https://www.media.uzh.ch/en/Press-Releases/2017/Generosity.html',
                class: ''
            },
            {
                icon: 'cube',
                color: 'danger',
                text: lang[`Don't Show for 1 Week`],
                href: '#',
                class: 'hide_donate',
            },
        ],function(n,button){
            buttonHtml += `<a style="margin-bottom:4px" ${ button.href ? `href="${button.href}"` : '' } target="_blank" class="d-flex flex-row btn btn-sm btn-block btn-${ button.color } ${ button.class }">
                <div><i class="fa fa-${ button.icon }" aria-hidden="true"></i></div>
                <div class="text-center flex-grow-1">${ button.text }</div>
            </a>`
        })
        openMessage = new PNotify({
            title: `It's a proven fact`,
            text: `
            <div class="mb-3">Generosity makes you a happier person, please consider supporting the development.</div>
            <div class="mb-3">If you are already supporting the development, please contact us or use your provided license key and we can get this popup to go away for you <i class="fa fa-smile-o"></i> Cheers!</div>
            ${buttonHtml}`,
            hide: false,
        })
    }
    function dontShowForOneWeek(){
        if(openMessage){
            openMessage.remove()
        }
        dashboardOptions('subscription_checked',new Date());
    }
    if(!userHasSubscribed && !dashboardOptions().subscription_checked || lessThanOneWeekAgo(new Date(dashboardOptions().subscription_checked))){
        setTimeout(function(){
            showHelpNotice()
        },1000 * 60 * 0.2)
    }
    $('body').on('click','.hide_donate',function(e){
        e.preventDefault()
        dontShowForOneWeek()
        return false;
    })
    console.log('Please support the Shinobi developement.')
    console.log('https://licenses.shinobi.video/subscribe')
})
